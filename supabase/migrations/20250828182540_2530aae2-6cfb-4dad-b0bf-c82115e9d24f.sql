-- Create table for smart tags generated from journal entries
CREATE TABLE public.journal_smart_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id UUID NOT NULL,
  user_id UUID NOT NULL,
  tag_type TEXT NOT NULL, -- 'mood', 'topic', 'person', 'location', 'activity', etc.
  tag_value TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.5, -- AI confidence in tag (0.0-1.0)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journal_smart_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for smart tags
CREATE POLICY "Users can view their own smart tags" 
ON public.journal_smart_tags 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own smart tags" 
ON public.journal_smart_tags 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own smart tags" 
ON public.journal_smart_tags 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own smart tags" 
ON public.journal_smart_tags 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for faster searching
CREATE INDEX idx_journal_smart_tags_journal_id ON public.journal_smart_tags(journal_id);
CREATE INDEX idx_journal_smart_tags_user_id ON public.journal_smart_tags(user_id);
CREATE INDEX idx_journal_smart_tags_type_value ON public.journal_smart_tags(tag_type, tag_value);
CREATE INDEX idx_journal_smart_tags_created_at ON public.journal_smart_tags(created_at);

-- Create full-text search indexes on journals table for faster content search
CREATE INDEX idx_journals_content_fts ON public.journals USING GIN(to_tsvector('english', content));
CREATE INDEX idx_journals_title_fts ON public.journals USING GIN(to_tsvector('english', title));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_journal_smart_tags_updated_at
BEFORE UPDATE ON public.journal_smart_tags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();