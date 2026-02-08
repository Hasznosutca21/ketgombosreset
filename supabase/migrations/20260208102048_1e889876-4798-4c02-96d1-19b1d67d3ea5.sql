-- Add vehicle image URL column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS vehicle_image_url text;