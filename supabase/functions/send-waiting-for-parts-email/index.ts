import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { missing_part, additional_notes, customer_name, customer_email, language, reservation_id } =
      await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isHu = language === "hu";

    const subject = isHu
      ? "TESLAND – Alkatrészre várakozás"
      : "TESLAND – Waiting for Parts";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <div style="background:#171717;padding:24px 32px;text-align:center">
      <h1 style="color:#fff;font-size:20px;margin:0;letter-spacing:1px">TESLAND</h1>
    </div>
    <div style="padding:32px">
      <p style="color:#171717;font-size:16px;margin:0 0 8px">
        ${isHu ? "Kedves" : "Dear"} ${customer_name || (isHu ? "Ügyfelünk" : "Customer")},
      </p>
      <p style="color:#525252;font-size:14px;line-height:1.6;margin:0 0 20px">
        ${isHu
          ? "Az Ön járművén megkezdett munka során kiderült, hogy egy alkatrész beszerzése szükséges a javítás befejezéséhez."
          : "During the service of your vehicle, we found that a part needs to be ordered to complete the repair."}
      </p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;margin:0 0 20px">
        <p style="color:#9a3412;font-size:13px;font-weight:600;margin:0 0 4px">
          ⚠️ ${isHu ? "Szükséges alkatrész" : "Required part"}
        </p>
        <p style="color:#c2410c;font-size:15px;font-weight:700;margin:0">
          ${missing_part}
        </p>
      </div>
      ${additional_notes ? `
      <div style="background:#f4f4f5;border-radius:8px;padding:12px 16px;margin:0 0 20px">
        <p style="color:#71717a;font-size:12px;margin:0 0 4px">${isHu ? "Megjegyzés" : "Note"}</p>
        <p style="color:#3f3f46;font-size:14px;margin:0">${additional_notes}</p>
      </div>` : ""}
      <p style="color:#525252;font-size:14px;line-height:1.6;margin:0 0 20px">
        ${isHu
          ? "Amint az alkatrész megérkezik, felvesszük Önnel a kapcsolatot az új időpont egyeztetéséhez."
          : "Once the part arrives, we will contact you to schedule a new appointment."}
      </p>
      <p style="color:#a1a1aa;font-size:12px;margin:0;text-align:center">
        ${isHu ? "Köszönjük türelmét!" : "Thank you for your patience!"}
      </p>
    </div>
  </div>
</body>
</html>`;

    if (customer_email) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "TESLAND <onboarding@resend.dev>",
          to: [customer_email],
          subject,
          html,
        }),
      });

      const emailData = await emailRes.json();
      console.log("Email sent:", emailData);
    } else {
      console.log("No customer_email provided, skipping email send for reservation:", reservation_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
