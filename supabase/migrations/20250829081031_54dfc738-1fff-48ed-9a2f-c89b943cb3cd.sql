-- Check if journal-media bucket exists and is properly configured
SELECT * FROM storage.buckets WHERE id = 'journal-media';

-- Make sure journal-media bucket is public for easier access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'journal-media';

-- Create comprehensive RLS policies for journal-media storage bucket
CREATE POLICY "Users can view their own journal media" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own journal media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own journal media" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own journal media" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'journal-media' AND auth.uid()::text = (storage.foldername(name))[1]);