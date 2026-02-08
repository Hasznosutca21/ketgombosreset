-- Add unique constraint to prevent double bookings
-- First, let's check and delete duplicates keeping only the earliest one
DELETE FROM appointments a
USING appointments b
WHERE a.id > b.id
  AND a.appointment_date = b.appointment_date
  AND a.appointment_time = b.appointment_time
  AND a.location = b.location
  AND a.status != 'cancelled'
  AND b.status != 'cancelled';

-- Create unique index that only applies to non-cancelled appointments
CREATE UNIQUE INDEX idx_unique_booking 
ON appointments (appointment_date, appointment_time, location) 
WHERE status != 'cancelled';