import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PushSubscription {
  id: string;
  appointment_id: string;
  device_token: string;
  platform: 'ios' | 'android';
}

interface Appointment {
  id: string;
  service: string;
  vehicle: string;
  appointment_date: string;
  appointment_time: string;
  location: string;
  name: string;
}

const serviceNames: Record<string, string> = {
  maintenance: "Annual Maintenance",
  battery: "Battery Service",
  brake: "Brake Service",
  software: "Software Update",
  body: "Body Repair",
  warranty: "Warranty Service",
};

const vehicleNames: Record<string, string> = {
  "model-s": "Model S",
  "model-s-plaid": "Model S Plaid",
  "model-3": "Model 3",
  "model-3-performance": "Model 3 Performance",
  "model-x": "Model X",
  "model-x-plaid": "Model X Plaid",
  "model-y": "Model Y",
  "model-y-performance": "Model Y Performance",
  cybertruck: "Cybertruck",
  "cybertruck-cyberbeast": "Cybertruck Cyberbeast",
  roadster: "Roadster",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentication: Require secret token for cron jobs
    const cronSecret = Deno.env.get("CRON_SECRET_TOKEN");
    const providedToken = req.headers.get("X-Cron-Secret");
    
    if (!cronSecret || providedToken !== cronSecret) {
      console.log("[PUSH] Unauthorized request - missing or invalid cron secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the time window for appointments starting in 1 hour
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    
    const currentDate = now.toISOString().split('T')[0];
    const targetHour = oneHourFromNow.getHours();
    const targetMinute = oneHourFromNow.getMinutes();

    console.log(`Checking for appointments on ${currentDate} around ${targetHour}:${targetMinute}`);

    // Get appointments happening in approximately 1 hour
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', currentDate)
      .eq('status', 'confirmed');

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      return new Response(
        JSON.stringify({ error: 'Failed to process notifications' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Found ${appointments?.length || 0} appointments for today`);

    // Filter appointments that are approximately 1 hour from now
    const upcomingAppointments = (appointments || []).filter((apt: Appointment) => {
      const aptTime = parseTimeString(apt.appointment_time);
      if (!aptTime) return false;
      
      const aptMinutes = aptTime.hours * 60 + aptTime.minutes;
      const targetMinutes = targetHour * 60 + targetMinute;
      
      // Within 10 minute window
      return Math.abs(aptMinutes - targetMinutes) <= 10;
    });

    console.log(`Found ${upcomingAppointments.length} appointments starting in ~1 hour`);

    const notificationResults = [];

    for (const appointment of upcomingAppointments) {
      // Get push subscriptions for this appointment
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('appointment_id', appointment.id);

      if (subError) {
        console.error(`Error fetching subscriptions for appointment ${appointment.id}:`, subError);
        continue;
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No push subscriptions for appointment ${appointment.id}`);
        continue;
      }

      const serviceName = serviceNames[appointment.service] || appointment.service;
      const vehicleName = vehicleNames[appointment.vehicle] || appointment.vehicle;

      for (const subscription of subscriptions as PushSubscription[]) {
        try {
          // For FCM (Android)
          if (subscription.platform === 'android' && fcmServerKey) {
            const response = await fetch('https://fcm.googleapis.com/fcm/send', {
              method: 'POST',
              headers: {
                'Authorization': `key=${fcmServerKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: subscription.device_token,
                notification: {
                  title: 'Upcoming TESLAND Service Appointment',
                  body: `Your ${serviceName} for ${vehicleName} is in 1 hour!`,
                },
                data: {
                  appointmentId: appointment.id,
                },
              }),
            });

            console.log(`FCM notification sent for appointment ${appointment.id}, status: ${response.status}`);
            notificationResults.push({ 
              appointmentId: appointment.id, 
              platform: 'android', 
              success: response.ok 
            });
          }

          // For iOS (APNs)
          if (subscription.platform === 'ios') {
            console.log(`iOS push notification would be sent for appointment ${appointment.id}`);
            notificationResults.push({ 
              appointmentId: appointment.id, 
              platform: 'ios', 
              success: true,
              note: 'iOS notifications require APNs configuration'
            });
          }
        } catch (notifError) {
          console.error(`Error sending notification for subscription ${subscription.id}:`, notifError);
          notificationResults.push({ 
            appointmentId: appointment.id, 
            platform: subscription.platform, 
            success: false
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: upcomingAppointments.length,
        notifications: notificationResults.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in send-push-notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process push notifications' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  // Handle 24-hour format (e.g., "14:00")
  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return { hours: parseInt(match24[1]), minutes: parseInt(match24[2]) };
  }
  
  // Handle 12-hour format (e.g., "2:00 PM")
  const match12 = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match12) return null;
  
  let hours = parseInt(match12[1]);
  const minutes = parseInt(match12[2]);
  const isPM = match12[3].toUpperCase() === 'PM';
  
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  
  return { hours, minutes };
}
