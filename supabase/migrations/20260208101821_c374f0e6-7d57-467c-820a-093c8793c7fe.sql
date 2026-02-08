-- Add vehicle fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN vehicle_model text,
ADD COLUMN vehicle_type text,
ADD COLUMN vehicle_year integer,
ADD COLUMN vehicle_vin text,
ADD COLUMN vehicle_plate text;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.vehicle_model IS 'Tesla model (Model S, Model 3, Model X, Model Y)';
COMMENT ON COLUMN public.profiles.vehicle_type IS 'Vehicle variant/type (Long Range, Performance, Standard Range, etc.)';
COMMENT ON COLUMN public.profiles.vehicle_year IS 'Vehicle manufacturing year';
COMMENT ON COLUMN public.profiles.vehicle_vin IS 'Vehicle Identification Number';
COMMENT ON COLUMN public.profiles.vehicle_plate IS 'License plate number (rendszám)';