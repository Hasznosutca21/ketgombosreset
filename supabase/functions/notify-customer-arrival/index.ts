import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const { reservation_id, arrival_type, language } = await req.json();

    if (!reservation_id) {
      return new Response(
        JSON.stringify({ error: "reservation_id is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get all admin push subscriptions to notify admins
    const { data: adminSubs, error: adminSubError } = await adminClient
      .from('admin_push_subscriptions')
      .select('*');

    if (adminSubError) {
      console.error('[ARRIVAL] Error fetching admin subs:', adminSubError);
    }

    const isHu = language === "hu";
    const title = isHu ? "Ügyfél megérkezett!" : "Customer arrived!";
    const arrivalMethod = arrival_type === "geofence"
      ? (isHu ? "(automatikus helymeghatározás)" : "(automatic geolocation)")
      : (isHu ? "(manuális jelzés)" : "(manual check-in)");
    const body = `${isHu ? "Foglalás" : "Reservation"} #${reservation_id} – ${arrivalMethod}`;

    const results: any[] = [];

    // Send push notifications to all admin devices
    if (adminSubs && adminSubs.length > 0 && fcmServerKey) {
      for (const sub of adminSubs) {
        if (sub.platform === 'android' || sub.platform === 'web') {
          try {
            const response = await fetch('https://fcm.googleapis.com/fcm/send', {
              method: 'POST',
              headers: {
                'Authorization': `key=${fcmServerKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: sub.device_token,
                notification: { title, body },
                data: { reservationId: String(reservation_id), type: 'customer_arrival' },
              }),
            });
            results.push({ platform: sub.platform, success: response.ok });
          } catch (e) {
            console.error('[ARRIVAL] FCM error:', e);
            results.push({ platform: sub.platform, success: false });
          }
        }
      }
    }

    console.log(`[ARRIVAL] Reservation ${reservation_id} – ${arrival_type}. Notified ${results.length} admin device(s).`);

    return new Response(
      JSON.stringify({ success: true, notified: results.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error('[ARRIVAL] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
