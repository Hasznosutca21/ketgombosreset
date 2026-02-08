-- Add vehicle_vin column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN vehicle_vin text;