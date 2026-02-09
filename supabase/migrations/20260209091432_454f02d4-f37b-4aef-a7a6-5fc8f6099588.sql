-- Fix the appointments SELECT policy that exposes customer data publicly
-- Remove the 'OR true' condition that makes it readable by anyone

DROP POLICY IF EXISTS "Users can view appointments" ON public.appointments;

CREATE POLICY "Users can view appointments" 
ON public.appointments 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND (
    (email = (auth.jwt() ->> 'email'::text)) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);