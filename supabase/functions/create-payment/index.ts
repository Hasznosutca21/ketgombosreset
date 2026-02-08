import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const { appointmentId, serviceId, customerEmail, customerName } = await req.json();

    console.log("Creating payment for:", { appointmentId, serviceId, customerEmail });

    if (!appointmentId || !serviceId || !customerEmail) {
      throw new Error("Missing required fields: appointmentId, serviceId, or customerEmail");
    }

    const servicePrice = SERVICE_PRICES[serviceId];
    if (!servicePrice) {
      throw new Error(`Unknown service: ${serviceId}`);
    }

    if (servicePrice.amount === 0) {
      throw new Error("This service is free (warranty service)");
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
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [
        {
          price_data: {
            currency: "huf",
            product_data: {
              name: servicePrice.name,
              description: `Szolgáltatás fizetése - Foglalás: ${appointmentId}`,
            },
            unit_amount: servicePrice.amount,
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
        customerName,
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
