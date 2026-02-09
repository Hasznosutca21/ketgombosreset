import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Input validation schema
const PaymentRequestSchema = z.object({
  appointmentId: z.string().uuid("Invalid appointment ID"),
  serviceId: z.string().min(1).max(50),
  customerEmail: z.string().email("Invalid email address").max(255),
  customerName: z.string().max(100).optional(),
});

// Service prices in HUF (forints) - stored in minor units
const SERVICE_PRICES: Record<string, { amount: number; name: string }> = {
  maintenance: { amount: 25000, name: "Általános átvizsgálás" },
  battery: { amount: 31750, name: "Éves felülvizsgálat" },
  brake: { amount: 20000, name: "Fékszerviz" },
  ac: { amount: 18000, name: "Klíma szerviz" },
  heatpump: { amount: 22000, name: "Hőszivattyú szerviz" },
  heating: { amount: 15000, name: "Fűtésrendszer" },
  software: { amount: 10000, name: "Software frissítés" },
  autopilot: { amount: 25000, name: "Autopilot kalibrálás" },
  multimedia: { amount: 12000, name: "Multimédia frissítés" },
  body: { amount: 50000, name: "Karosszéria javítás" },
  warranty: { amount: 0, name: "Garanciális szerviz" },
  tires: { amount: 15000, name: "Abroncs szerviz" },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate input
    const rawData = await req.json();
    const validationResult = PaymentRequestSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: "Invalid request data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { appointmentId, serviceId, customerEmail, customerName } = validationResult.data;

    console.log("Creating payment for:", { appointmentId, serviceId, customerEmail });

    const servicePrice = SERVICE_PRICES[serviceId];
    if (!servicePrice) {
      return new Response(
        JSON.stringify({ error: `Unknown service: ${serviceId}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (servicePrice.amount === 0) {
      return new Response(
        JSON.stringify({ error: "This service is free (warranty service)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the appointment exists in the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, email, service")
      .eq("id", appointmentId)
      .maybeSingle();

    if (appointmentError || !appointment) {
      console.error("Appointment not found:", appointmentId);
      return new Response(
        JSON.stringify({ error: "Appointment not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the email matches the appointment
    if (appointment.email !== customerEmail) {
      console.error("Email mismatch for appointment:", appointmentId);
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log("Found existing customer:", customerId);
    }

    // Create a one-time payment session
    // Note: Stripe treats HUF as a two-decimal currency, so we multiply by 100
    // Payment method types include card (with Google Pay & Apple Pay wallets)
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      locale: "hu",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "huf",
            product_data: {
              name: servicePrice.name,
              description: `Szolgáltatás fizetése - Foglalás: ${appointmentId}`,
            },
            unit_amount: servicePrice.amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/manage?id=${appointmentId}&payment=success`,
      cancel_url: `${req.headers.get("origin")}/manage?id=${appointmentId}&payment=cancelled`,
      metadata: {
        appointmentId,
        serviceId,
        customerName: customerName || "",
      },
    });

    console.log("Payment session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});