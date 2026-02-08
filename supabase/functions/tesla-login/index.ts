import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TESLA_AUTH_URL = "https://auth.tesla.com/oauth2/v3";
const TESLA_API_URL = "https://owner-api.teslamotors.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TESLA_CLIENT_ID = Deno.env.get("TESLA_CLIENT_ID");
    const TESLA_CLIENT_SECRET = Deno.env.get("TESLA_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!TESLA_CLIENT_ID || !TESLA_CLIENT_SECRET) {
      console.error("Tesla API credentials not configured");
      throw new Error("Tesla API credentials not configured");
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY not configured");
      throw new Error("Service role key not configured");
    }

    const { code, redirect_uri } = await req.json();

    if (!code || !redirect_uri) {
      return new Response(
        JSON.stringify({ error: "Missing code or redirect_uri" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Exchanging Tesla authorization code for tokens...");

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(`${TESLA_AUTH_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: TESLA_CLIENT_ID,
        client_secret: TESLA_CLIENT_SECRET,
        code,
        redirect_uri,
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
    console.log("Tesla token exchange successful");

    // Get user info from Tesla
    let teslaUserInfo = null;
    try {
      const userInfoResponse = await fetch(`${TESLA_AUTH_URL}/userinfo`, {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (userInfoResponse.ok) {
        teslaUserInfo = await userInfoResponse.json();
        console.log("Tesla user info retrieved:", teslaUserInfo?.email);
      }
    } catch (err) {
      console.warn("Could not fetch Tesla user info:", err);
    }

    if (!teslaUserInfo?.email) {
      return new Response(
        JSON.stringify({ error: "Could not retrieve Tesla user email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user exists with this email
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    let userId: string;
    let isNewUser = false;
    
    const existingUser = existingUsers?.users?.find(u => u.email === teslaUserInfo.email);
    
    if (existingUser) {
      userId = existingUser.id;
      console.log("Existing user found:", userId);
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: teslaUserInfo.email,
        email_confirm: true,
        user_metadata: {
          tesla_sub: teslaUserInfo.sub,
          full_name: teslaUserInfo.name,
          provider: "tesla",
        },
      });

      if (createError || !newUser.user) {
        console.error("Failed to create user:", createError);
        return new Response(
          JSON.stringify({ error: "Failed to create user account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = newUser.user.id;
      isNewUser = true;
      console.log("New user created:", userId);
    }

    // Store Tesla tokens
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);
    
    const { error: upsertError } = await supabaseAdmin
      .from("tesla_connections")
      .upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt.toISOString(),
      }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Failed to save Tesla connection:", upsertError);
      // Continue anyway - login should still work
    }

    // Generate a session for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: teslaUserInfo.email,
    });

    if (sessionError) {
      console.error("Failed to generate session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract the token from the magic link
    const magicLinkUrl = new URL(sessionData.properties?.action_link || "");
    const tokenHash = magicLinkUrl.searchParams.get("token");

    return new Response(
      JSON.stringify({ 
        success: true,
        is_new_user: isNewUser,
        email: teslaUserInfo.email,
        token_hash: tokenHash,
        verification_url: sessionData.properties?.action_link,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Tesla login error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
