import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tesla Fleet API regions
const FLEET_API_REGIONS = {
  eu: "https://fleet-api.prd.eu.vn.cloud.tesla.com",
  na: "https://fleet-api.prd.na.vn.cloud.tesla.com",
  cn: "https://fleet-api.prd.cn.vn.cloud.tesla.cn",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    const authHeader = req.headers.get("Authorization");
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

    const userId = userData.user.id;

    // Get the user's Tesla access token
    const { data: connection, error: connError } = await supabase
      .from("tesla_connections")
      .select("access_token")
      .eq("user_id", userId)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: "No Tesla connection found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { region = "eu" } = await req.json().catch(() => ({}));
    const fleetApiUrl = FLEET_API_REGIONS[region as keyof typeof FLEET_API_REGIONS] || FLEET_API_REGIONS.eu;

    console.log(`Registering partner account in region: ${region} at ${fleetApiUrl}`);

    // Register the partner account
    const registerResponse = await fetch(`${fleetApiUrl}/api/1/partner_accounts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${connection.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domain: "ketgombosreset.lovable.app",
      }),
    });

    const responseText = await registerResponse.text();
    console.log(`Tesla partner registration response: ${registerResponse.status} - ${responseText}`);

    if (!registerResponse.ok) {
      // Parse error response
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: responseText };
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorData.error || "Registration failed",
          status: registerResponse.status,
          details: errorData
        }),
        { status: registerResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }

    console.log("Partner registration successful:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Partner account registered successfully",
        region,
        result 
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
