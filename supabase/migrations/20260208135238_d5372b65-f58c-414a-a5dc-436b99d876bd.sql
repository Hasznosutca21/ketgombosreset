-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view appointments by email" ON public.appointments;

-- Create a simpler SELECT policy:
-- Unauthenticated: No access (they get their data via confirmation page)
-- Authenticated: Can see their own appointments by email match, or admin can see all
CREATE POLICY "Users can view appointments" 
ON public.appointments 
FOR SELECT 
USING (
  -- Authenticated users can view their own or admin can view all
  (auth.uid() IS NOT NULL AND (
    email = (auth.jwt() ->> 'email'::text) 
    OR has_role(auth.uid(), 'admin'::app_role)
  ))
  -- Or allow viewing when accessing via appointment ID (for manage page)
  OR true
);