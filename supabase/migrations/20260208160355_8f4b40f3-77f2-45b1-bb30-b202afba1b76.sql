-- Create table to store Tesla OAuth tokens for users
CREATE TABLE public.tesla_connections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.tesla_connections ENABLE ROW LEVEL SECURITY;

-- Users can only access their own Tesla connection
CREATE POLICY "Users can view their own Tesla connection"
ON public.tesla_connections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Tesla connection"
ON public.tesla_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Tesla connection"
ON public.tesla_connections
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Tesla connection"
ON public.tesla_connections
FOR DELETE
USING (auth.uid() = user_id);

-- Create table to cache vehicle data
CREATE TABLE public.tesla_vehicles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vin TEXT NOT NULL,
    display_name TEXT,
    vehicle_state JSONB,
    charge_state JSONB,
    drive_state JSONB,
    climate_state JSONB,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, vin)
);

-- Enable RLS
ALTER TABLE public.tesla_vehicles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own vehicles
CREATE POLICY "Users can view their own Tesla vehicles"
ON public.tesla_vehicles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Tesla vehicles"
ON public.tesla_vehicles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Tesla vehicles"
ON public.tesla_vehicles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Tesla vehicles"
ON public.tesla_vehicles
FOR DELETE
USING (auth.uid() = user_id);

-- Update trigger for tesla_connections
CREATE TRIGGER update_tesla_connections_updated_at
BEFORE UPDATE ON public.tesla_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();