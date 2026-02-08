import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_AUTH_URL = "https://auth.tesla.com/oauth2/v3";
const TESLA_FLEET_API = "https://fleet-api.prd.eu.vn.cloud.tesla.com";

async function refreshTeslaToken(
  supabase: any,
  userId: string,
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  try {
    const response = await fetch(`${TESLA_AUTH_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error("Failed to refresh Tesla token:", response.status);
      return null;
    }

    const tokenData = await response.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await supabase.from("tesla_connections").update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt.toISOString(),
    }).eq("user_id", userId);

    return tokenData.access_token;
  } catch (error) {
    console.error("Error refreshing Tesla token:", error);
    return null;
  }
}

async function getValidToken(
  supabase: any,
  userId: string,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  const { data: connection, error } = await supabase
    .from("tesla_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (error || !connection) {
    console.error("No Tesla connection found for user");
    return null;
  }

  const expiresAt = new Date(connection.expires_at);
  const now = new Date();

  // Refresh if token expires within 5 minutes
  if (expiresAt.getTime() - now.getTime() < 5 * 60 * 1000) {
    console.log("Token expired or expiring soon, refreshing...");
    return await refreshTeslaToken(
      supabase,
      userId,
      connection.refresh_token,
      clientId,
      clientSecret
    );
  }

  return connection.access_token;
}

async function callTeslaApi(
  accessToken: string,
  endpoint: string,
  method: string = "GET",
  body?: any
): Promise<any> {
  const response = await fetch(`${TESLA_FLEET_API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Tesla API error [${endpoint}]:`, response.status, errorText);
    throw new Error(`Tesla API error: ${response.status}`);
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TESLA_CLIENT_ID = Deno.env.get("TESLA_CLIENT_ID");
    const TESLA_CLIENT_SECRET = Deno.env.get("TESLA_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!TESLA_CLIENT_ID || !TESLA_CLIENT_SECRET) {
      throw new Error("Tesla API credentials not configured");
    }

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
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.user.id;
    const { action, vin, command } = await req.json();

    const accessToken = await getValidToken(
      supabase,
      userId,
      TESLA_CLIENT_ID,
      TESLA_CLIENT_SECRET
    );

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Tesla account not connected or token expired" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // List all vehicles
    if (action === "list_vehicles") {
      const data = await callTeslaApi(accessToken, "/api/1/vehicles");
      
      // Cache vehicles in database
      for (const vehicle of data.response || []) {
        await supabase.from("tesla_vehicles").upsert({
          user_id: userId,
          vin: vehicle.vin,
          display_name: vehicle.display_name,
          last_updated: new Date().toISOString(),
        }, { onConflict: "user_id,vin" });
      }

      return new Response(
        JSON.stringify({ vehicles: data.response }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get vehicle data
    if (action === "vehicle_data" && vin) {
      const endpoints = "charge_state;drive_state;climate_state;vehicle_state";
      const data = await callTeslaApi(
        accessToken,
        `/api/1/vehicles/${vin}/vehicle_data?endpoints=${endpoints}`
      );

      // Cache vehicle data
      await supabase.from("tesla_vehicles").upsert({
        user_id: userId,
        vin,
        display_name: data.response?.display_name,
        vehicle_state: data.response?.vehicle_state,
        charge_state: data.response?.charge_state,
        drive_state: data.response?.drive_state,
        climate_state: data.response?.climate_state,
        last_updated: new Date().toISOString(),
      }, { onConflict: "user_id,vin" });

      return new Response(
        JSON.stringify({ vehicle: data.response }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Wake up vehicle
    if (action === "wake_up" && vin) {
      const data = await callTeslaApi(
        accessToken,
        `/api/1/vehicles/${vin}/wake_up`,
        "POST"
      );

      return new Response(
        JSON.stringify({ success: true, state: data.response?.state }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vehicle commands
    if (action === "command" && vin && command) {
      const allowedCommands = [
        "door_lock",
        "door_unlock",
        "flash_lights",
        "honk_horn",
        "climate_on",
        "climate_off",
        "charge_start",
        "charge_stop",
        "charge_port_door_open",
        "charge_port_door_close",
      ];

      if (!allowedCommands.includes(command)) {
        return new Response(
          JSON.stringify({ error: `Command not allowed: ${command}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await callTeslaApi(
        accessToken,
        `/api/1/vehicles/${vin}/command/${command}`,
        "POST"
      );

      return new Response(
        JSON.stringify({ success: data.response?.result, reason: data.response?.reason }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Tesla API error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
