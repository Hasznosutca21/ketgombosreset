import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Input validation schema
const AppointmentEmailSchema = z.object({
  appointmentId: z.string().uuid('Invalid appointment ID'),
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email('Invalid email address').max(255),
  service: z.string().max(50),
  vehicle: z.string().max(50),
  appointmentDate: z.string(),
  appointmentTime: z.string().max(20),
  location: z.string().max(100),
  language: z.enum(['hu', 'en']).optional(),
  manageUrl: z.string().url().optional(),
});

// Sanitize text for email content
function sanitizeForEmail(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .replace(/[\r\n]/g, ' ')
    .trim()
    .substring(0, 100);
}

// Translations
const translations = {
  hu: {
    teslaService: "TESLAND",
    appointmentConfirmed: "Időpont megerősítve!",
    greeting: (name: string) => `Kedves ${name}, szerviz időpontja sikeresen lefoglalva.`,
    service: "Szolgáltatás",
    vehicle: "Jármű",
    date: "Dátum",
    time: "Időpont",
    location: "Helyszín",
    reminder: "📱 Emlékeztetőt küldünk 1 órával az időpont előtt.",
    needChanges: "Módosítani szeretné időpontját?",
    manageAppointment: "Időpont kezelése",
    support: "Támogatás",
    locations: "Helyszínek",
    contact: "Kapcsolat",
    subject: (service: string, date: string) => `Időpont megerősítve - ${service}, ${date}`,
    services: {
      maintenance: "Általános átvizsgálás",
      battery: "Éves felülvizsgálat",
      brake: "Fékszerviz",
      ac: "Klíma szerviz",
      heatpump: "Hőszivattyú szerviz",
      heating: "Fűtésrendszer",
      software: "Software frissítés",
      autopilot: "Autopilot kalibrálás",
      multimedia: "Multimédia frissítés",
      body: "Karosszéria javítás",
      warranty: "Garanciális szerviz",
      tires: "Abroncs szerviz",
    },
    locationsList: {
      nagytarcsa: { name: "TESLAND Nagytarcsa", address: "Ganz Ábrahám utca 3, Nagytarcsa, Magyarország" },
    },
  },
  en: {
    teslaService: "TESLAND",
    appointmentConfirmed: "Appointment Confirmed!",
    greeting: (name: string) => `Hi ${name}, your service appointment has been scheduled.`,
    service: "Service",
    vehicle: "Vehicle",
    date: "Date",
    time: "Time",
    location: "Location",
    reminder: "📱 You'll receive a reminder notification 1 hour before your appointment.",
    needChanges: "Need to reschedule or cancel?",
    manageAppointment: "Manage Appointment",
    support: "Support",
    locations: "Locations",
    contact: "Contact",
    subject: (service: string, date: string) => `Appointment Confirmed - ${service} on ${date}`,
    services: {
      maintenance: "General Inspection",
      battery: "Annual Inspection",
      brake: "Brake Service",
      ac: "AC Service",
      heatpump: "Heat Pump Service",
      heating: "Heating System",
      software: "Software Update",
      autopilot: "Autopilot Calibration",
      multimedia: "Multimedia Update",
      body: "Body Repair",
      warranty: "Warranty Service",
      tires: "Tire Service",
    },
    locationsList: {
      nagytarcsa: { name: "TESLAND Nagytarcsa", address: "Ganz Ábrahám utca 3, Nagytarcsa, Hungary" },
    },
  },
};

const vehicleNames: Record<string, string> = {
  "model-s": "Model S",
  "model-s-plaid": "Model S Plaid",
  "model-3": "Model 3",
  "model-3-performance": "Model 3 Performance",
  "model-x": "Model X",
  "model-x-plaid": "Model X Plaid",
  "model-y": "Model Y",
  "model-y-performance": "Model Y Performance",
  cybertruck: "Cybertruck",
  "cybertruck-cyberbeast": "Cybertruck Cyberbeast",
  roadster: "Roadster",
};

// Admin notification email
const ADMIN_EMAIL = "info@tesland.hu";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create service client for database access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse and validate input
    const rawData = await req.json();
    const validationResult = AppointmentEmailSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = validationResult.data;
    console.log(`Sending confirmation email for appointment:`, data.appointmentId);

    // Verify the appointment exists in the database
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, email')
      .eq('id', data.appointmentId)
      .maybeSingle();

    if (appointmentError || !appointment) {
      console.error('Appointment not found:', data.appointmentId);
      return new Response(
        JSON.stringify({ error: 'Appointment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the email matches the appointment
    if (appointment.email.toLowerCase() !== data.customerEmail.toLowerCase()) {
      console.error('Email mismatch for appointment:', data.appointmentId);
      return new Response(
        JSON.stringify({ error: 'Email mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lang = data.language === "en" ? "en" : "hu";
    const t = translations[lang];

    // Sanitize user-provided content
    const safeName = sanitizeForEmail(data.customerName);
    const serviceName = t.services[data.service as keyof typeof t.services] || sanitizeForEmail(data.service);
    const vehicleName = vehicleNames[data.vehicle] || sanitizeForEmail(data.vehicle);
    const locationData = t.locationsList[data.location as keyof typeof t.locationsList] || { name: sanitizeForEmail(data.location), address: '' };

    const dateObj = new Date(data.appointmentDate);
    const formattedDate = dateObj.toLocaleDateString(lang === "hu" ? "hu-HU" : "en-US", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Generate manage URL
    const manageUrl = data.manageUrl || `https://ketgombosreset.lovable.app/manage?id=${data.appointmentId}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${t.appointmentConfirmed}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; color: #171717; -webkit-font-smoothing: antialiased;">
          <div style="max-width: 560px; margin: 0 auto; padding: 48px 24px;">
            
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 48px;">
              <span style="font-size: 20px; font-weight: 300; letter-spacing: 4px; color: #171717;">TESLAND</span>
            </div>

            <!-- Main Card -->
            <div style="background: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
              
              <!-- Header -->
              <div style="padding: 40px 40px 32px; text-align: center; border-bottom: 1px solid #e5e5e5;">
                <div style="width: 56px; height: 56px; background: #171717; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #ffffff; font-size: 24px; line-height: 56px;">✓</span>
                </div>
                <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 500; letter-spacing: -0.5px; color: #171717;">${t.appointmentConfirmed}</h1>
                <p style="margin: 0; font-size: 15px; color: #737373; font-weight: 300;">${t.greeting(safeName)}</p>
              </div>

              <!-- Details -->
              <div style="padding: 32px 40px;">
                
                <!-- Service -->
                <div style="margin-bottom: 24px;">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a3a3a3; margin-bottom: 4px;">${t.service}</div>
                  <div style="font-size: 16px; font-weight: 400; color: #171717;">${serviceName}</div>
                </div>

                <!-- Vehicle -->
                <div style="margin-bottom: 24px;">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a3a3a3; margin-bottom: 4px;">${t.vehicle}</div>
                  <div style="font-size: 16px; font-weight: 400; color: #171717;">Tesla ${vehicleName}</div>
                </div>

                <!-- Date & Time Row -->
                <div style="display: flex; gap: 32px; margin-bottom: 24px;">
                  <div style="flex: 1;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a3a3a3; margin-bottom: 4px;">${t.date}</div>
                    <div style="font-size: 16px; font-weight: 400; color: #171717;">${formattedDate}</div>
                  </div>
                  <div>
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a3a3a3; margin-bottom: 4px;">${t.time}</div>
                    <div style="font-size: 16px; font-weight: 400; color: #171717;">${data.appointmentTime}</div>
                  </div>
                </div>

                <!-- Location -->
                <div style="padding-top: 24px; border-top: 1px solid #e5e5e5;">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #a3a3a3; margin-bottom: 4px;">${t.location}</div>
                  <div style="font-size: 16px; font-weight: 400; color: #171717;">${locationData.name}</div>
                  <div style="font-size: 14px; color: #737373; margin-top: 2px;">${locationData.address}</div>
                </div>

              </div>

              <!-- CTA -->
              <div style="padding: 24px 40px 40px; text-align: center;">
                <p style="margin: 0 0 16px; font-size: 14px; color: #737373;">${t.needChanges}</p>
                <a href="${manageUrl}" style="display: inline-block; background: #171717; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 14px; font-weight: 500; letter-spacing: 0.3px;">
                  ${t.manageAppointment}
                </a>
              </div>

            </div>

            <!-- Reminder -->
            <div style="margin-top: 24px; padding: 20px; background: #ffffff; border-radius: 4px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
              <p style="margin: 0; font-size: 14px; color: #525252;">
                ${t.reminder}
              </p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 40px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                © ${new Date().getFullYear()} TESLAND. All rights reserved.
              </p>
            </div>

          </div>
        </body>
      </html>
    `;

    // Send email to customer AND cc to admin
    // Using Resend test domain until tesland.hu is verified
    const { data: emailResult, error } = await resend.emails.send({
      from: 'TESLAND <onboarding@resend.dev>',
      to: [data.customerEmail],
      cc: [ADMIN_EMAIL],
      subject: t.subject(serviceName, formattedDate),
      html: emailHtml,
    });

    if (error) {
      console.error('Error sending email:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to send confirmation email. Please try again later.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Email sent successfully:', emailResult?.id);

    // Send push notifications to admins
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    if (fcmServerKey) {
      try {
        // Get all admin push subscriptions
        const { data: adminSubscriptions, error: subError } = await supabase
          .from('admin_push_subscriptions')
          .select('device_token, platform');

        if (subError) {
          console.error('Error fetching admin push subscriptions:', subError);
        } else if (adminSubscriptions && adminSubscriptions.length > 0) {
          console.log(`Sending push notifications to ${adminSubscriptions.length} admin devices`);
          
          for (const subscription of adminSubscriptions) {
            try {
              if (subscription.platform === 'android') {
                const response = await fetch('https://fcm.googleapis.com/fcm/send', {
                  method: 'POST',
                  headers: {
                    'Authorization': `key=${fcmServerKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    to: subscription.device_token,
                    notification: {
                      title: '🔔 Új időpontfoglalás!',
                      body: `${safeName} - ${serviceName} (${vehicleName}) - ${formattedDate} ${data.appointmentTime}`,
                    },
                    data: {
                      appointmentId: data.appointmentId,
                      type: 'new_appointment',
                    },
                  }),
                });
                console.log(`Admin push notification sent, status: ${response.status}`);
              }
              
              if (subscription.platform === 'ios') {
                // iOS APNs notification would be sent here
                console.log('iOS admin push notification would be sent');
              }
            } catch (pushError) {
              console.error('Error sending admin push notification:', pushError);
            }
          }
        } else {
          console.log('No admin push subscriptions found');
        }
      } catch (pushError) {
        console.error('Error processing admin push notifications:', pushError);
      }
    } else {
      console.log('FCM_SERVER_KEY not configured, skipping admin push notifications');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-confirmation-email:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send confirmation email. Please try again later.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
