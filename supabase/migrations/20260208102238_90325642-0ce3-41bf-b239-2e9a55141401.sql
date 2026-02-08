-- Create vehicle-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true);

-- Create RLS policies for vehicle-images bucket
CREATE POLICY "Vehicle images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Users can upload their own vehicle images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'vehicle-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own vehicle images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'vehicle-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own vehicle images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'vehicle-images' AND auth.uid()::text = (storage.foldername(name))[1]);