import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "info@tesland.hu";

const translations = {
  hu: {
    subject: (service: string, date: string) => `Emlékeztető: ${service} holnap - ${date}`,
    greeting: (name: string) => `Kedves ${name}!`,
    reminder: "Emlékeztetünk, hogy holnap van az időpontja a TESLAND-nál:",
    service: "Szolgáltatás:",
    vehicle: "Jármű:",
    dateTime: "Időpont:",
    location: "Helyszín:",
    address: "Ganz Ábrahám utca 3, Nagytarcsa",
    cancelInfo: "Ha nem tud eljönni, kérjük lemondja az időpontot a weboldalunkon.",
    seeYou: "Várjuk szeretettel!",
    team: "A TESLAND csapata",
  },
  en: {
    subject: (service: string, date: string) => `Reminder: ${service} tomorrow - ${date}`,
    greeting: (name: string) => `Dear ${name},`,
    reminder: "This is a reminder that your appointment at TESLAND is tomorrow:",
    service: "Service:",
    vehicle: "Vehicle:",
    dateTime: "Date & Time:",
    location: "Location:",
    address: "Ganz Ábrahám utca 3, Nagytarcsa",
    cancelInfo: "If you cannot attend, please cancel your appointment on our website.",
    seeYou: "We look forward to seeing you!",
    team: "The TESLAND Team",
  },
};

const serviceNames: Record<string, { hu: string; en: string }> = {
  "annual-inspection": { hu: "Éves felülvizsgálat", en: "Annual Inspection" },
  "brake-service": { hu: "Fékszerviz", en: "Brake Service" },
  "tire-rotation": { hu: "Kerékcsere/Kiegyensúlyozás", en: "Tire Rotation" },
  "ac-service": { hu: "Klímaszerviz", en: "A/C Service" },
  "heating-check": { hu: "Fűtés ellenőrzés", en: "Heating Check" },
  "ceramic-coating": { hu: "Kerámia bevonat", en: "Ceramic Coating" },
  "ppf": { hu: "PPF fóliázás", en: "Paint Protection Film" },
  "window-tint": { hu: "Ablakfóliázás", en: "Window Tinting" },
  "general-checkup": { hu: "Általános átvizsgálás", en: "General Checkup" },
  "software-update": { hu: "Szoftverfrissítés", en: "Software Update" },
};

const vehicleLabels: Record<string, string> = {
  "model-s": "Model S",
  "model-3": "Model 3",
  "model-x": "Model X",
  "model-y": "Model Y",
  "cybertruck": "Cybertruck",
  "roadster": "Roadster",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication: Require secret token for cron jobs
    const cronSecret = Deno.env.get("CRON_SECRET_TOKEN");
    const providedToken = req.headers.get("X-Cron-Secret");
    
    if (!cronSecret || providedToken !== cronSecret) {
      console.log("[REMINDER] Unauthorized request - missing or invalid cron secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendKey);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    console.log(`[REMINDER] Checking appointments for ${tomorrowStr}`);

    // Get all confirmed appointments for tomorrow
    const { data: appointments, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("appointment_date", tomorrowStr)
      .in("status", ["confirmed", "rescheduled"]);

    if (error) throw error;

    console.log(`[REMINDER] Found ${appointments?.length || 0} appointments for tomorrow`);

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let sentCount = 0;

    for (const appointment of appointments) {
      try {
        // Default to Hungarian
        const t = translations.hu;
        const serviceName = serviceNames[appointment.service]?.hu || appointment.service;
        const vehicleName = `Tesla ${vehicleLabels[appointment.vehicle] || appointment.vehicle}`;
        
        const formattedDate = new Date(appointment.appointment_date).toLocaleDateString("hu-HU", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #ffffff; font-size: 28px; font-weight: 600; margin: 0;">TESLAND</h1>
    </div>
    
    <div style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; padding: 32px; border: 1px solid #333;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
          <span style="font-size: 28px;">⏰</span>
        </div>
      </div>
      
      <p style="color: #ffffff; font-size: 18px; margin: 0 0 16px 0;">${t.greeting(appointment.name)}</p>
      <p style="color: #a1a1aa; font-size: 16px; margin: 0 0 24px 0;">${t.reminder}</p>
      
      <div style="background: #0a0a0a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="margin-bottom: 16px;">
          <span style="color: #71717a; font-size: 12px; text-transform: uppercase;">${t.service}</span>
          <p style="color: #ffffff; font-size: 16px; margin: 4px 0 0 0; font-weight: 500;">${serviceName}</p>
        </div>
        <div style="margin-bottom: 16px;">
          <span style="color: #71717a; font-size: 12px; text-transform: uppercase;">${t.vehicle}</span>
          <p style="color: #ffffff; font-size: 16px; margin: 4px 0 0 0;">${vehicleName}</p>
        </div>
        <div style="margin-bottom: 16px;">
          <span style="color: #71717a; font-size: 12px; text-transform: uppercase;">${t.dateTime}</span>
          <p style="color: #e11d48; font-size: 18px; margin: 4px 0 0 0; font-weight: 600;">${formattedDate}, ${appointment.appointment_time}</p>
        </div>
        <div>
          <span style="color: #71717a; font-size: 12px; text-transform: uppercase;">${t.location}</span>
          <p style="color: #ffffff; font-size: 16px; margin: 4px 0 0 0;">${t.address}</p>
        </div>
      </div>
      
      <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 24px 0;">${t.cancelInfo}</p>
      <p style="color: #ffffff; font-size: 16px; margin: 0 0 8px 0;">${t.seeYou}</p>
      <p style="color: #e11d48; font-size: 14px; margin: 0; font-weight: 500;">${t.team}</p>
    </div>
  </div>
</body>
</html>`;

        await resend.emails.send({
          from: "TESLAND <info@tesland.hu>",
          to: [appointment.email],
          cc: [ADMIN_EMAIL],
          subject: t.subject(serviceName, formattedDate),
          html: emailHtml,
        });

        console.log(`[REMINDER] Sent reminder to ${appointment.email}`);
        sentCount++;
      } catch (emailError) {
        console.error(`[REMINDER] Failed to send to ${appointment.email}:`, emailError);
      }
    }

    console.log(`[REMINDER] Successfully sent ${sentCount} reminder emails`);

    return new Response(JSON.stringify({ sent: sentCount, total: appointments.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[REMINDER] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
