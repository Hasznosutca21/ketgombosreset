-- Create vehicles table to support multiple vehicles per user (max 3)
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_name TEXT,
  model TEXT NOT NULL,
  type TEXT,
  year INTEGER,
  vin TEXT,
  plate TEXT,
  image_url TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for VIN per user (each VIN should be unique within a user's vehicles)
CREATE UNIQUE INDEX idx_vehicles_user_vin ON public.vehicles (user_id, vin) WHERE vin IS NOT NULL AND vin != '';

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Users can view their own vehicles
CREATE POLICY "Users can view their own vehicles"
ON public.vehicles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own vehicles (max 3 enforced at application level)
CREATE POLICY "Users can insert their own vehicles"
ON public.vehicles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own vehicles
CREATE POLICY "Users can update their own vehicles"
ON public.vehicles
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own vehicles
CREATE POLICY "Users can delete their own vehicles"
ON public.vehicles
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();