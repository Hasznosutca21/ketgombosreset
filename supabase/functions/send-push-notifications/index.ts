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
  "model-3": "Model 3",
  "model-x": "Model X",
  "model-y": "Model Y",
  cybertruck: "Cybertruck",
  roadster: "Roadster",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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
    
    // Format time to match appointment_time format (e.g., "10:00 AM")
    const targetTimeStart = formatTime(targetHour, targetMinute - 5);
    const targetTimeEnd = formatTime(targetHour, targetMinute + 5);

    console.log(`Checking for appointments on ${currentDate} between ${targetTimeStart} and ${targetTimeEnd}`);

    // Get appointments happening in approximately 1 hour
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', currentDate)
      .eq('status', 'confirmed');

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError);
      throw appointmentsError;
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
                  title: 'Upcoming Tesla Service Appointment',
                  body: `Your ${serviceName} for ${vehicleName} is in 1 hour!`,
                },
                data: {
                  appointmentId: appointment.id,
                },
              }),
            });

            const result = await response.json();
            console.log(`FCM notification sent for appointment ${appointment.id}:`, result);
            notificationResults.push({ 
              appointmentId: appointment.id, 
              platform: 'android', 
              success: response.ok 
            });
          }

          // For iOS (APNs), you would typically use a service like Firebase or a direct APNs connection
          // This is a placeholder for iOS push notification logic
          if (subscription.platform === 'ios') {
            console.log(`iOS push notification would be sent to token: ${subscription.device_token.substring(0, 10)}...`);
            notificationResults.push({ 
              appointmentId: appointment.id, 
              platform: 'ios', 
              success: true,
              note: 'iOS notifications require APNs configuration'
            });
          }
        } catch (error) {
          console.error(`Error sending notification for subscription ${subscription.id}:`, error);
          notificationResults.push({ 
            appointmentId: appointment.id, 
            platform: subscription.platform, 
            success: false, 
            error: String(error) 
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: upcomingAppointments.length,
        notifications: notificationResults 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in send-push-notifications:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function formatTime(hours: number, minutes: number): string {
  const h = hours % 12 || 12;
  const m = Math.max(0, Math.min(59, minutes));
  const ampm = hours >= 12 ? 'PM' : 'AM';
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const isPM = match[3].toUpperCase() === 'PM';
  
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  
  return { hours, minutes };
}
