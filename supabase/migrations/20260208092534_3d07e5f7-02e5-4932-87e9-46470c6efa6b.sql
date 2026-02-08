-- Fix RLS for appointments table - restrict SELECT to only the appointment owner by email
DROP POLICY IF EXISTS "Anyone can view appointments" ON public.appointments;

-- Users can only view their own appointments (by email match)
CREATE POLICY "Users can view their own appointments"
ON public.appointments
FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix RLS for push_subscriptions table - restrict SELECT to linked appointment owner
DROP POLICY IF EXISTS "Anyone can view push subscriptions" ON public.push_subscriptions;

-- Users can only view push subscriptions for their appointments
CREATE POLICY "Users can view their own push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (
  appointment_id IN (
    SELECT id FROM public.appointments 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Add rate limiting capability - create a function to check recent appointments
CREATE OR REPLACE FUNCTION public.count_recent_appointments_by_email(check_email text, hours_ago integer DEFAULT 24)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.appointments
  WHERE email = check_email
    AND created_at > NOW() - (hours_ago || ' hours')::interval
$$;