-- Drop existing complex SELECT policy for push_subscriptions
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON public.push_subscriptions;

-- Create a simpler, more secure SELECT policy
-- Admins can view all, users can only view subscriptions linked to their appointments
CREATE POLICY "Users can view their own push subscriptions" 
ON public.push_subscriptions 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = push_subscriptions.appointment_id
      AND a.email = (auth.jwt() ->> 'email'::text)
    )
  )
);