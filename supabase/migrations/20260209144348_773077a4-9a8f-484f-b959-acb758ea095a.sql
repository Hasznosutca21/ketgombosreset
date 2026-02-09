
-- Create work_sheets table
CREATE TABLE public.work_sheets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  vehicle text NOT NULL,
  vehicle_vin text,
  service text NOT NULL,
  service_date date NOT NULL,
  description text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_sheets ENABLE ROW LEVEL SECURITY;

-- Only admins can CRUD work sheets
CREATE POLICY "Admins can view all work sheets"
  ON public.work_sheets FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create work sheets"
  ON public.work_sheets FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update work sheets"
  ON public.work_sheets FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete work sheets"
  ON public.work_sheets FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_work_sheets_updated_at
  BEFORE UPDATE ON public.work_sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
