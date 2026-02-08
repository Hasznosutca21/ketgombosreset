import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const serviceNames: Record<string, string> = {
  maintenance: "Annual Maintenance",
  battery: "Battery Service",
  brake: "Brake Service",
  software: "Software Update",
  body: "Body Repair",
  warranty: "Warranty Service",
};

const vehicleNames: Record<string, string> = {
  "model-s": "Model S",
  "model-3": "Model 3",
  "model-x": "Model X",
  "model-y": "Model Y",
  cybertruck: "Cybertruck",
  roadster: "Roadster",
};

const locationInfo: Record<string, { name: string; address: string }> = {
  sf: { name: "San Francisco Service Center", address: "123 Tesla Blvd, SF, CA" },
  la: { name: "Los Angeles Service Center", address: "456 Electric Ave, LA, CA" },
  ny: { name: "New York Service Center", address: "789 Innovation St, NY, NY" },
};

interface AppointmentEmailRequest {
  appointmentId: string;
  customerName: string;
  customerEmail: string;
  service: string;
  vehicle: string;
  appointmentDate: string;
  appointmentTime: string;
  location: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const data: AppointmentEmailRequest = await req.json();
    console.log('Sending confirmation email for appointment:', data.appointmentId);

    const serviceName = serviceNames[data.service] || data.service;
    const vehicleName = vehicleNames[data.vehicle] || data.vehicle;
    const locationData = locationInfo[data.location] || { name: data.location, address: '' };

    // Format the date nicely
    const dateObj = new Date(data.appointmentDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Appointment Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="display: inline-flex; align-items: center; gap: 8px;">
                <span style="font-size: 32px;">⚡</span>
                <span style="font-size: 24px; font-weight: 600; color: #e11d48;">Tesla Service</span>
              </div>
            </div>

            <!-- Success Icon -->
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="width: 80px; height: 80px; background: rgba(225, 29, 72, 0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">✓</span>
              </div>
            </div>

            <!-- Main Content -->
            <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px; margin-bottom: 32px;">
              <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; text-align: center;">Appointment Confirmed!</h1>
              <p style="margin: 0 0 32px 0; color: #a1a1aa; text-align: center;">Hi ${data.customerName}, your service appointment has been scheduled.</p>

              <!-- Appointment Details -->
              <div style="display: grid; gap: 24px;">
                <!-- Service -->
                <div style="display: flex; gap: 16px; align-items: flex-start;">
                  <div style="width: 40px; height: 40px; background: rgba(225, 29, 72, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span>🔧</span>
                  </div>
                  <div>
                    <div style="color: #a1a1aa; font-size: 14px;">Service</div>
                    <div style="font-weight: 500; font-size: 16px;">${serviceName}</div>
                  </div>
                </div>

                <!-- Vehicle -->
                <div style="display: flex; gap: 16px; align-items: flex-start;">
                  <div style="width: 40px; height: 40px; background: rgba(225, 29, 72, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span>🚗</span>
                  </div>
                  <div>
                    <div style="color: #a1a1aa; font-size: 14px;">Vehicle</div>
                    <div style="font-weight: 500; font-size: 16px;">Tesla ${vehicleName}</div>
                  </div>
                </div>

                <!-- Date -->
                <div style="display: flex; gap: 16px; align-items: flex-start;">
                  <div style="width: 40px; height: 40px; background: rgba(225, 29, 72, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span>📅</span>
                  </div>
                  <div>
                    <div style="color: #a1a1aa; font-size: 14px;">Date</div>
                    <div style="font-weight: 500; font-size: 16px;">${formattedDate}</div>
                  </div>
                </div>

                <!-- Time -->
                <div style="display: flex; gap: 16px; align-items: flex-start;">
                  <div style="width: 40px; height: 40px; background: rgba(225, 29, 72, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span>🕐</span>
                  </div>
                  <div>
                    <div style="color: #a1a1aa; font-size: 14px;">Time</div>
                    <div style="font-weight: 500; font-size: 16px;">${data.appointmentTime}</div>
                  </div>
                </div>

                <!-- Location -->
                <div style="display: flex; gap: 16px; align-items: flex-start;">
                  <div style="width: 40px; height: 40px; background: rgba(225, 29, 72, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <span>📍</span>
                  </div>
                  <div>
                    <div style="color: #a1a1aa; font-size: 14px;">Location</div>
                    <div style="font-weight: 500; font-size: 16px;">${locationData.name}</div>
                    <div style="color: #a1a1aa; font-size: 14px;">${locationData.address}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Reminder Note -->
            <div style="background: rgba(225, 29, 72, 0.1); border: 1px solid rgba(225, 29, 72, 0.2); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 32px;">
              <p style="margin: 0; color: #fca5a5; font-size: 14px;">
                📱 You'll receive a reminder notification 1 hour before your appointment.
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 32px;">
              <p style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 14px;">
                Need to make changes? Contact us at support@tesla-service.com
              </p>
              <div style="display: flex; justify-content: center; gap: 24px; color: #71717a; font-size: 12px;">
                <span>Support</span>
                <span>Locations</span>
                <span>Contact</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data: emailResult, error } = await resend.emails.send({
      from: 'Tesla Service <onboarding@resend.dev>',
      to: [data.customerEmail],
      subject: `Appointment Confirmed - ${serviceName} on ${formattedDate}`,
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
    console.error('Error in send-confirmation-email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
