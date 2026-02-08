-- Drop the problematic SELECT policy
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;

-- Create a new SELECT policy using auth.jwt() instead of auth.users table
CREATE POLICY "Users can view their own appointments"
ON public.appointments
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND (
    email = (auth.jwt() ->> 'email')::text 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);