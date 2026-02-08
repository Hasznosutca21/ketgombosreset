import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Te egy segítőkész Tesla szerviz asszisztens vagy. Magyarul válaszolsz a kérdésekre.

**Elérhető szolgáltatások:**
- Általános szerviz - Rendszeres karbantartás és ellenőrzés
- Fékrendszer - Fékbetét csere, féktárcsa felújítás
- Futómű - Lengéscsillapító, kerékcsapágy javítás
- Klíma szerviz - Klíma töltés, szűrő csere
- Akkumulátor - Akkumulátor diagnosztika és csere
- Karosszéria - Fényezés, horpadás javítás

**Tesla modellek amiket szervizelünk:**
- Model S
- Model 3
- Model X
- Model Y
- Cybertruck

**Nyitvatartás:**
- Hétfő-Péntek: 8:00 - 18:00
- Szombat: 9:00 - 14:00
- Vasárnap: Zárva

**Helyszín:** Budapest

**Fontos tudnivalók:**
- Időpontfoglalás online vagy telefonon
- Minden munkára garanciát vállalunk
- Eredeti Tesla alkatrészeket használunk
- Kölcsönautó igényelhető nagyobb javításokhoz

Légy kedves, segítőkész és informatív. Ha a felhasználó időpontot szeretne foglalni, irányítsd az online foglalási rendszerhez. Rövid, tömör válaszokat adj, de legyél barátságos.`;

// Input validation schema
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(10000, "Message content too long"),
});

const RequestSchema = z.object({
  messages: z.array(MessageSchema).max(50, "Too many messages in conversation"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    
    // Validate input
    const validationResult = RequestSchema.safeParse(rawData);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: "Invalid request data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Túl sok kérés. Kérjük, próbálja újra később." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Szolgáltatás ideiglenesen nem elérhető." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Hiba történt a válasz generálása közben." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Appointment assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Ismeretlen hiba" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});