-- Drop the tesla_connections table that stores plaintext OAuth tokens
-- This table is no longer used after migrating to the custom REST API
DROP TABLE IF EXISTS public.tesla_connections;

-- Also drop the unused tesla_vehicles table
DROP TABLE IF EXISTS public.tesla_vehicles;
