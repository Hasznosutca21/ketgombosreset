-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Rate limited appointment creation" ON public.appointments;

-- Create a new INSERT policy that allows anyone to create appointments (with rate limiting)
CREATE POLICY "Anyone can create appointments with rate limit" 
ON public.appointments 
FOR INSERT 
WITH CHECK (count_recent_appointments_by_email(email, 24) < 5);

-- Also need to update SELECT policy to allow users to view their own appointments by email (without auth)
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;

-- Create a more permissive SELECT policy - users can view by email match
CREATE POLICY "Users can view appointments by email" 
ON public.appointments 
FOR SELECT 
USING (
  email = current_setting('request.headers', true)::json->>'x-appointment-email'
  OR (auth.uid() IS NOT NULL AND (
    email = (auth.jwt() ->> 'email'::text) 
    OR has_role(auth.uid(), 'admin'::app_role)
  ))
);

-- Also allow unauthenticated UPDATE for reschedule/cancel by email verification
DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;

CREATE POLICY "Users can update their own appointments" 
ON public.appointments 
FOR UPDATE 
USING (
  email = current_setting('request.headers', true)::json->>'x-appointment-email'
  OR (auth.uid() IS NOT NULL AND (
    email = (auth.jwt() ->> 'email'::text) 
    OR has_role(auth.uid(), 'admin'::app_role)
  ))
);