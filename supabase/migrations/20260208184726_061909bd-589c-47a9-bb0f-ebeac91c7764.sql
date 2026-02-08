-- Create table for admin push subscriptions
CREATE TABLE public.admin_push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_token)
);

-- Enable RLS
ALTER TABLE public.admin_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage their own push subscriptions
CREATE POLICY "Admins can view their own push subscriptions"
ON public.admin_push_subscriptions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id);

CREATE POLICY "Admins can insert their own push subscriptions"
ON public.admin_push_subscriptions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id);

CREATE POLICY "Admins can delete their own push subscriptions"
ON public.admin_push_subscriptions
FOR DELETE
USING (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_admin_push_subscriptions_updated_at
BEFORE UPDATE ON public.admin_push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();