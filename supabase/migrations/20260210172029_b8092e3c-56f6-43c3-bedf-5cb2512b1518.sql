
-- Make vehicle-images bucket private
UPDATE storage.buckets SET public = false WHERE id = 'vehicle-images';

-- Add read policy for vehicle images (with unique name to avoid conflict)
CREATE POLICY "Authenticated users can read own vehicle images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'vehicle-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
