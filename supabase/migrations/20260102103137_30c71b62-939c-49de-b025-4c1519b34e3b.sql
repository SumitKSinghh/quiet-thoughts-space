-- Create table for storing AI-generated user insights
CREATE TABLE public.user_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL, -- 'mood_pattern', 'goal_progress', 'suggestion', 'overall'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  analyzed_entries_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own insights" 
ON public.user_insights 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own insights" 
ON public.user_insights 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights" 
ON public.user_insights 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights" 
ON public.user_insights 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_insights_updated_at
BEFORE UPDATE ON public.user_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_user_insights_user_id ON public.user_insights(user_id);
CREATE INDEX idx_user_insights_type ON public.user_insights(insight_type);