import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const translations = {
  hu: {
    teslaService: "Tesla Szerviz",
    // Cancellation
    appointmentCancelled: "Időpont lemondva",
    cancellationGreeting: (name: string) => `Kedves ${name}, időpontja sikeresen lemondásra került.`,
    cancellationSubject: (service: string) => `Időpont lemondva - ${service}`,
    cancelledDetails: "A következő időpont lemondásra került:",
    bookNew: "Szeretne új időpontot foglalni?",
    bookNewAppointment: "Új időpont foglalása",
    // Reschedule
    appointmentRescheduled: "Időpont átütemezve",
    rescheduleGreeting: (name: string) => `Kedves ${name}, időpontja sikeresen átütemezésre került.`,
    rescheduleSubject: (service: string, newDate: string) => `Időpont átütemezve - ${service}, ${newDate}`,
    newAppointmentDetails: "Új időpont részletei:",
    previousDateTime: "Korábbi időpont",
    newDateTime: "Új időpont",
    // Common
    service: "Szolgáltatás",
    vehicle: "Jármű",
    date: "Dátum",
    time: "Időpont",
    location: "Helyszín",
    manageAppointment: "Időpont kezelése",
    support: "Támogatás",
    locations: "Helyszínek",
    contact: "Kapcsolat",
    services: {
      maintenance: "Éves karbantartás",
      battery: "Akkumulátor szerviz",
      brake: "Fékszerviz",
      software: "Software frissítés",
      body: "Karosszéria javítás",
      warranty: "Garanciális szerviz",
    },
    locationsList: {
      sf: { name: "San Francisco Szervizközpont", address: "123 Tesla Blvd, SF, CA" },
      la: { name: "Los Angeles Szervizközpont", address: "456 Electric Ave, LA, CA" },
      ny: { name: "New York Szervizközpont", address: "789 Innovation St, NY, NY" },
    },
  },
  en: {
    teslaService: "Tesla Service",
    // Cancellation
    appointmentCancelled: "Appointment Cancelled",
    cancellationGreeting: (name: string) => `Hi ${name}, your appointment has been successfully cancelled.`,
    cancellationSubject: (service: string) => `Appointment Cancelled - ${service}`,
    cancelledDetails: "The following appointment has been cancelled:",
    bookNew: "Would you like to book a new appointment?",
    bookNewAppointment: "Book New Appointment",
    // Reschedule
    appointmentRescheduled: "Appointment Rescheduled",
    rescheduleGreeting: (name: string) => `Hi ${name}, your appointment has been successfully rescheduled.`,
    rescheduleSubject: (service: string, newDate: string) => `Appointment Rescheduled - ${service} to ${newDate}`,
    newAppointmentDetails: "New appointment details:",
    previousDateTime: "Previous date/time",
    newDateTime: "New date/time",
    // Common
    service: "Service",
    vehicle: "Vehicle",
    date: "Date",
    time: "Time",
    location: "Location",
    manageAppointment: "Manage Appointment",
    support: "Support",
    locations: "Locations",
    contact: "Contact",
    services: {
      maintenance: "Annual Maintenance",
      battery: "Battery Service",
      brake: "Brake Service",
      software: "Software Update",
      body: "Body Repair",
      warranty: "Warranty Service",
    },
    locationsList: {
      sf: { name: "San Francisco Service Center", address: "123 Tesla Blvd, SF, CA" },
      la: { name: "Los Angeles Service Center", address: "456 Electric Ave, LA, CA" },
      ny: { name: "New York Service Center", address: "789 Innovation St, NY, NY" },
    },
  },
};

const vehicleNames: Record<string, string> = {
  "model-s": "Model S",
  "model-3": "Model 3",
  "model-x": "Model X",
  "model-y": "Model Y",
  cybertruck: "Cybertruck",
  roadster: "Roadster",
};

interface UpdateEmailRequest {
  type: "cancellation" | "reschedule";
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  service: string;
  vehicle: string;
  originalDate: string;
  originalTime: string;
  newDate?: string;
  newTime?: string;
  location: string;
  language?: "hu" | "en";
}

const formatDate = (dateStr: string, lang: "hu" | "en") => {
  const dateObj = new Date(dateStr);
  return dateObj.toLocaleDateString(lang === "hu" ? "hu-HU" : "en-US", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const data: UpdateEmailRequest = await req.json();
    console.log(`Sending ${data.type} email for appointment:`, data.appointmentId);

    const lang = data.language === "en" ? "en" : "hu";
    const t = translations[lang];

    const serviceName = t.services[data.service as keyof typeof t.services] || data.service;
    const vehicleName = vehicleNames[data.vehicle] || data.vehicle;
    const locationData = t.locationsList[data.location as keyof typeof t.locationsList] || { name: data.location, address: '' };
    
    const originalFormattedDate = formatDate(data.originalDate, lang);
    const newFormattedDate = data.newDate ? formatDate(data.newDate, lang) : '';
    
    const manageUrl = `https://ketgombosreset.lovable.app/manage?id=${data.appointmentId}`;
    const homeUrl = "https://ketgombosreset.lovable.app/";

    let subject: string;
    let headerTitle: string;
    let greeting: string;
    let mainContent: string;
    let ctaButton: string;
    let ctaUrl: string;
    let headerIcon: string;
    let headerColor: string;

    if (data.type === "cancellation") {
      subject = t.cancellationSubject(serviceName);
      headerTitle = t.appointmentCancelled;
      greeting = t.cancellationGreeting(data.customerName);
      headerIcon = "✕";
      headerColor = "#ef4444";
      ctaButton = t.bookNewAppointment;
      ctaUrl = homeUrl;
      
      mainContent = `
        <p style="margin: 0 0 24px 0; color: #a1a1aa; text-align: center;">${t.cancelledDetails}</p>
        
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <div style="display: grid; gap: 16px;">
            <div style="display: flex; gap: 12px; align-items: center;">
              <span>🔧</span>
              <div>
                <div style="color: #a1a1aa; font-size: 12px;">${t.service}</div>
                <div style="font-weight: 500;">${serviceName}</div>
              </div>
            </div>
            <div style="display: flex; gap: 12px; align-items: center;">
              <span>📅</span>
              <div>
                <div style="color: #a1a1aa; font-size: 12px;">${t.date}</div>
                <div style="font-weight: 500; text-decoration: line-through; opacity: 0.7;">${originalFormattedDate}</div>
              </div>
            </div>
            <div style="display: flex; gap: 12px; align-items: center;">
              <span>🕐</span>
              <div>
                <div style="color: #a1a1aa; font-size: 12px;">${t.time}</div>
                <div style="font-weight: 500; text-decoration: line-through; opacity: 0.7;">${data.originalTime}</div>
              </div>
            </div>
          </div>
        </div>
        
        <p style="margin: 0; color: #a1a1aa; text-align: center; font-size: 14px;">${t.bookNew}</p>
      `;
    } else {
      subject = t.rescheduleSubject(serviceName, newFormattedDate);
      headerTitle = t.appointmentRescheduled;
      greeting = t.rescheduleGreeting(data.customerName);
      headerIcon = "📅";
      headerColor = "#e11d48";
      ctaButton = t.manageAppointment;
      ctaUrl = manageUrl;
      
      mainContent = `
        <p style="margin: 0 0 24px 0; color: #a1a1aa; text-align: center;">${t.newAppointmentDetails}</p>
        
        <!-- Previous appointment (crossed out) -->
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 16px; margin-bottom: 16px; opacity: 0.6;">
          <div style="color: #a1a1aa; font-size: 12px; margin-bottom: 8px;">${t.previousDateTime}</div>
          <div style="text-decoration: line-through;">
            ${originalFormattedDate} - ${data.originalTime}
          </div>
        </div>
        
        <!-- New appointment -->
        <div style="background: rgba(225, 29, 72, 0.1); border: 1px solid rgba(225, 29, 72, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <div style="color: #fca5a5; font-size: 12px; margin-bottom: 8px;">${t.newDateTime}</div>
          <div style="display: grid; gap: 16px;">
            <div style="display: flex; gap: 12px; align-items: center;">
              <span>🔧</span>
              <div>
                <div style="color: #a1a1aa; font-size: 12px;">${t.service}</div>
                <div style="font-weight: 500;">${serviceName}</div>
              </div>
            </div>
            <div style="display: flex; gap: 12px; align-items: center;">
              <span>🚗</span>
              <div>
                <div style="color: #a1a1aa; font-size: 12px;">${t.vehicle}</div>
                <div style="font-weight: 500;">Tesla ${vehicleName}</div>
              </div>
            </div>
            <div style="display: flex; gap: 12px; align-items: center;">
              <span>📅</span>
              <div>
                <div style="color: #a1a1aa; font-size: 12px;">${t.date}</div>
                <div style="font-weight: 500; color: #4ade80;">${newFormattedDate}</div>
              </div>
            </div>
            <div style="display: flex; gap: 12px; align-items: center;">
              <span>🕐</span>
              <div>
                <div style="color: #a1a1aa; font-size: 12px;">${t.time}</div>
                <div style="font-weight: 500; color: #4ade80;">${data.newTime}</div>
              </div>
            </div>
            <div style="display: flex; gap: 12px; align-items: center;">
              <span>📍</span>
              <div>
                <div style="color: #a1a1aa; font-size: 12px;">${t.location}</div>
                <div style="font-weight: 500;">${locationData.name}</div>
                <div style="color: #a1a1aa; font-size: 12px;">${locationData.address}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${headerTitle}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="display: inline-flex; align-items: center; gap: 8px;">
                <span style="font-size: 32px;">⚡</span>
                <span style="font-size: 24px; font-weight: 600; color: #e11d48;">${t.teslaService}</span>
              </div>
            </div>

            <!-- Icon -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 80px; height: 80px; background: ${headerColor}22; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">${headerIcon}</span>
              </div>
            </div>

            <!-- Main Content -->
            <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px; margin-bottom: 32px;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; text-align: center;">${headerTitle}</h1>
              <p style="margin: 0 0 32px 0; color: #a1a1aa; text-align: center;">${greeting}</p>

              ${mainContent}
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${ctaUrl}" style="display: inline-block; background: #e11d48; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 14px;">
                ${ctaButton}
              </a>
            </div>

            <!-- Footer -->
            <div style="text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 32px;">
              <div style="display: flex; justify-content: center; gap: 24px; color: #71717a; font-size: 12px;">
                <span>${t.support}</span>
                <span>${t.locations}</span>
                <span>${t.contact}</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data: emailResult, error } = await resend.emails.send({
      from: 'Tesla Service <onboarding@resend.dev>',
      to: [data.customerEmail],
      subject: subject,
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResult?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-appointment-update-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
