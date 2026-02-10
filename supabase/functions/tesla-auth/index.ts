import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_AUTH_URL = "https://auth.tesla.com/oauth2/v3";
const TESLA_FLEET_API = "https://fleet-api.prd.eu.vn.cloud.tesla.com";

// Allowed redirect URIs whitelist
const ALLOWED_REDIRECT_URI_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.lovable\.app(\/.*)?$/,
  /^https:\/\/ketgombosreset\.lovable\.app(\/.*)?$/,
  /^http:\/\/localhost:\d+(\/.*)?$/,
  /^https:\/\/[a-z0-9-]+\.supabase\.co(\/.*)?$/,
];

function isAllowedRedirectUri(uri: string): boolean {
  return ALLOWED_REDIRECT_URI_PATTERNS.some((pattern) => pattern.test(uri));
}

// Input validation schemas
const GetAuthUrlSchema = z.object({
  action: z.enum(["get_auth_url", "get_auth_url_public"]),
  redirect_uri: z.string().url().max(500),
});

const ExchangeCodeSchema = z.object({
  action: z.literal("exchange_code"),
  code: z.string().regex(/^[A-Za-z0-9_.\-]+$/, "Invalid code format").max(2000),
  redirect_uri: z.string().url().max(500),
});

const SimpleActionSchema = z.object({
  action: z.enum(["disconnect", "status"]),
});

const RequestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("get_auth_url"), redirect_uri: z.string().url().max(500) }),
  z.object({ action: z.literal("get_auth_url_public"), redirect_uri: z.string().url().max(500) }),
  z.object({ action: z.literal("exchange_code"), code: z.string().regex(/^[A-Za-z0-9_.\-]+$/).max(2000), redirect_uri: z.string().url().max(500) }),
  z.object({ action: z.literal("disconnect") }),
  z.object({ action: z.literal("status") }),
]);

function buildAuthUrl(clientId: string, redirectUri: string): string {
  const scopes = [
    "openid", "email", "offline_access", "user_data",
    "vehicle_device_data", "vehicle_cmds", "vehicle_charging_cmds",
  ].join(" ");

  const authUrl = new URL(`${TESLA_AUTH_URL}/authorize`);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("state", crypto.randomUUID());
  authUrl.searchParams.set("prompt_missing_scopes", "true");
  authUrl.searchParams.set("require_requested_scopes", "true");

  return authUrl.toString();
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

    const rawBody = await req.json();

    // Validate input
    const validationResult = RequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.issues);
      return new Response(
        JSON.stringify({ error: "Invalid request data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = validationResult.data;

    // Validate redirect_uri against whitelist for actions that use it
    if ("redirect_uri" in body && body.redirect_uri) {
      if (!isAllowedRedirectUri(body.redirect_uri)) {
        return new Response(
          JSON.stringify({ error: "Invalid redirect_uri" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Public action: Generate OAuth URL for Tesla login (no auth required)
    if (body.action === "get_auth_url_public") {
      const authUrl = buildAuthUrl(TESLA_CLIENT_ID, body.redirect_uri);
      return new Response(
        JSON.stringify({ auth_url: authUrl, state: new URL(authUrl).searchParams.get("state") }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All other actions require authentication
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

    // Generate OAuth URL for Tesla login (authenticated user)
    if (body.action === "get_auth_url") {
      const authUrl = buildAuthUrl(TESLA_CLIENT_ID, body.redirect_uri);
      return new Response(
        JSON.stringify({ auth_url: authUrl, state: new URL(authUrl).searchParams.get("state") }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange authorization code for tokens
    if (body.action === "exchange_code") {
      const tokenResponse = await fetch(`${TESLA_AUTH_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: TESLA_CLIENT_ID,
          client_secret: TESLA_CLIENT_SECRET,
          code: body.code,
          redirect_uri: body.redirect_uri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Tesla token exchange failed:", tokenResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: "Failed to exchange authorization code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenData = await tokenResponse.json();
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      const { error: upsertError } = await supabase
        .from("tesla_connections")
        .upsert({
          user_id: userId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: expiresAt.toISOString(),
        }, { onConflict: "user_id" });

      if (upsertError) {
        console.error("Failed to save Tesla connection:", upsertError);
        return new Response(
          JSON.stringify({ error: "Failed to save Tesla connection" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Disconnect Tesla account
    if (body.action === "disconnect") {
      const { error: deleteError } = await supabase
        .from("tesla_connections")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        console.error("Failed to delete Tesla connection:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to disconnect Tesla account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase.from("tesla_vehicles").delete().eq("user_id", userId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check connection status
    if (body.action === "status") {
      const { data: connection } = await supabase
        .from("tesla_connections")
        .select("expires_at")
        .eq("user_id", userId)
        .single();

      return new Response(
        JSON.stringify({ 
          connected: !!connection,
          expires_at: connection?.expires_at 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Tesla auth error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
