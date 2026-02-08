-- Add license plate position and size settings to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plate_position_x integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS plate_position_y integer DEFAULT 85,
ADD COLUMN IF NOT EXISTS plate_size integer DEFAULT 100;