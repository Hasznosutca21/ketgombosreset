import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tesla Fleet API regions
const FLEET_API_REGIONS = {
  eu: "https://fleet-api.prd.eu.vn.cloud.tesla.com",
  na: "https://fleet-api.prd.na.vn.cloud.tesla.com",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const TESLA_CLIENT_ID = Deno.env.get("TESLA_CLIENT_ID");
    const TESLA_CLIENT_SECRET = Deno.env.get("TESLA_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!TESLA_CLIENT_ID || !TESLA_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: "Tesla API credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({} as any));

    const region: string = body.region ?? "eu";
    const requestedDomain: string | undefined = body.domain;

    const originOrReferer = req.headers.get("origin") ?? req.headers.get("referer") ?? "";
    let originHostname: string | null = null;
    try {
      if (originOrReferer) originHostname = new URL(originOrReferer).hostname;
    } catch {
      originHostname = null;
    }

    const domain = (originHostname ?? requestedDomain ?? "").trim();
    if (!domain) {
      return new Response(JSON.stringify({ error: "Missing domain" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (requestedDomain && originHostname && requestedDomain !== originHostname) {
      return new Response(
        JSON.stringify({
          error: "Domain mismatch",
          requestedDomain,
          originHostname,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fleetApiUrl =
      FLEET_API_REGIONS[region as keyof typeof FLEET_API_REGIONS] ?? FLEET_API_REGIONS.eu;

    console.log(
      `Partner registration request user=${userData.user.id} domain=${domain} region=${region} origin=${originHostname ?? "(none)"}`
    );

    // Step 1: Generate Partner Token using client_credentials grant
    console.log("Step 1: Generating partner token...");
    
    const tokenResponse = await fetch("https://fleet-auth.prd.vn.cloud.tesla.com/oauth2/v3/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: TESLA_CLIENT_ID,
        client_secret: TESLA_CLIENT_SECRET,
        scope: "openid vehicle_device_data vehicle_cmds vehicle_charging_cmds",
        audience: fleetApiUrl,
      }),
    });

    const tokenResponseText = await tokenResponse.text();
    console.log(`Partner token response: ${tokenResponse.status} - ${tokenResponseText}`);

    if (!tokenResponse.ok) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          step: "partner_token",
          error: "Failed to generate partner token",
          status: tokenResponse.status,
          details: tokenResponseText
        }),
        { status: tokenResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let tokenData;
    try {
      tokenData = JSON.parse(tokenResponseText);
    } catch {
      return new Response(
        JSON.stringify({ 
          success: false, 
          step: "partner_token_parse",
          error: "Failed to parse partner token response",
          details: tokenResponseText
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const partnerToken = tokenData.access_token;
    console.log("Partner token generated successfully");

    // Step 2: Register the domain with the partner account
    console.log(`Step 2: Registering domain ${domain} at ${fleetApiUrl}...`);
    
    const registerResponse = await fetch(`${fleetApiUrl}/api/1/partner_accounts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${partnerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: domain,
      }),
    });

    const registerResponseText = await registerResponse.text();
    console.log(`Registration response: ${registerResponse.status} - ${registerResponseText}`);

    if (!registerResponse.ok) {
      // Check if already registered (might return specific error)
      let errorData;
      try {
        errorData = JSON.parse(registerResponseText);
      } catch {
        errorData = { error: registerResponseText };
      }

      // If already registered, that's actually OK
      if (registerResponseText.includes("already registered") || registerResponse.status === 409) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Domain already registered",
            region,
            domain
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          step: "register",
          error: errorData.error || "Registration failed",
          status: registerResponse.status,
          details: errorData
        }),
        { status: registerResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let registerResult;
    try {
      registerResult = JSON.parse(registerResponseText);
    } catch {
      registerResult = { message: registerResponseText || "Registration completed" };
    }

    console.log("Partner registration successful:", registerResult);

    // Step 3: Verify registration by checking public key
    console.log("Step 3: Verifying registration...");
    
    const verifyResponse = await fetch(`${fleetApiUrl}/api/1/partner_accounts/public_key?domain=${encodeURIComponent(domain)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${partnerToken}`,
      },
    });

    const verifyText = await verifyResponse.text();
    console.log(`Verification response: ${verifyResponse.status} - ${verifyText.substring(0, 200)}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Partner account registered successfully",
        region,
        domain,
        result: registerResult,
        verified: verifyResponse.ok
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Tesla partner registration error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
