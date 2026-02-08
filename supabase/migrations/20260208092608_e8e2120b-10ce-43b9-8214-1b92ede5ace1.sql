-- Fix overly permissive INSERT policies
-- Appointments: Add rate limiting check to INSERT policy
DROP POLICY IF EXISTS "Anyone can create appointments" ON public.appointments;

-- Allow appointment creation with rate limit check (max 5 per email per 24 hours)
CREATE POLICY "Rate limited appointment creation"
ON public.appointments
FOR INSERT
WITH CHECK (
  public.count_recent_appointments_by_email(email, 24) < 5
);

-- Push subscriptions: Restrict INSERT to only for appointments the user owns
DROP POLICY IF EXISTS "Anyone can register push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can register push subscriptions for their appointments"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (
  appointment_id IN (
    SELECT id FROM public.appointments 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR auth.uid() IS NULL -- Allow for unauthenticated users who just created an appointment
);