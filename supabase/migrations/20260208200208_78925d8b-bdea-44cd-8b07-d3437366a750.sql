-- Create customers table for admin-managed client database
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  note text,
  birthday date,
  privacy_policy_accepted_at timestamp with time zone,
  marketing_notifications_accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique constraint on email to prevent duplicates
CREATE UNIQUE INDEX customers_email_unique ON public.customers (email);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Only admins can view customers
CREATE POLICY "Admins can view all customers" 
ON public.customers 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert customers
CREATE POLICY "Admins can insert customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update customers
CREATE POLICY "Admins can update customers" 
ON public.customers 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete customers
CREATE POLICY "Admins can delete customers" 
ON public.customers 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();