-- Fix: Prevent anonymous access to appointments table
-- The existing policy allows authenticated users to see their own appointments
-- But we need to ensure anonymous users can't access any data

-- Add explicit deny for anonymous users on appointments (already handled by requiring auth.uid() in existing policy)
-- The issue is that the current policy uses a subquery that returns NULL for anonymous users
-- Let's add an explicit check

DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;

CREATE POLICY "Users can view their own appointments"
ON public.appointments
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Fix: Prevent anonymous access to profiles table  
-- The existing policies should already require auth.uid() = user_id, but let's verify

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND auth.uid() = user_id
);

-- Fix: Remove anonymous user allowance from push_subscriptions INSERT
DROP POLICY IF EXISTS "Users can register push subscriptions for their appointments" ON public.push_subscriptions;

-- Only allow authenticated users to register push subscriptions
CREATE POLICY "Authenticated users can register push subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  appointment_id IN (
    SELECT id FROM public.appointments 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Fix: Prevent anonymous access to user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND auth.uid() = user_id
);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role)
);

-- Fix: Add DELETE policy for push_subscriptions
CREATE POLICY "Users can delete their own push subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (
  auth.uid() IS NOT NULL AND
  appointment_id IN (
    SELECT id FROM public.appointments 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Also add UPDATE policy for push_subscriptions
CREATE POLICY "Users can update their own push subscriptions"
ON public.push_subscriptions
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  appointment_id IN (
    SELECT id FROM public.appointments 
    WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);