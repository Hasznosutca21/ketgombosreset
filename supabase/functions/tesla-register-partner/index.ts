import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tesla Fleet API regions
const FLEET_API_REGIONS = {
  eu: "https://fleet-api.prd.eu.vn.cloud.tesla.com",
  na: "https://fleet-api.prd.na.vn.cloud.tesla.com",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TESLA_CLIENT_ID = Deno.env.get("TESLA_CLIENT_ID");
    const TESLA_CLIENT_SECRET = Deno.env.get("TESLA_CLIENT_SECRET");

    if (!TESLA_CLIENT_ID || !TESLA_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: "Tesla API credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { region = "eu", domain = "ketgombosreset.lovable.app" } = await req.json().catch(() => ({}));
    const fleetApiUrl = FLEET_API_REGIONS[region as keyof typeof FLEET_API_REGIONS] || FLEET_API_REGIONS.eu;

    console.log(`Starting partner registration for domain: ${domain} in region: ${region}`);

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
