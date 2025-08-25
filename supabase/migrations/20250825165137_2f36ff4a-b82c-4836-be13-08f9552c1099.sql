-- Create journal_attachments table
CREATE TABLE public.journal_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id UUID NOT NULL,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.journal_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own journal attachments" 
ON public.journal_attachments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own journal attachments" 
ON public.journal_attachments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal attachments" 
ON public.journal_attachments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal attachments" 
ON public.journal_attachments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_journal_attachments_updated_at
BEFORE UPDATE ON public.journal_attachments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for journal media
INSERT INTO storage.buckets (id, name, public) VALUES ('journal-media', 'journal-media', false);

-- Create storage policies for journal media
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