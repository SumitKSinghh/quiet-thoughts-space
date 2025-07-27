-- Create goals table for Goal Progress Tracker
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC NOT NULL DEFAULT 1,
  current_value NUMERIC NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'count', -- e.g., 'count', 'hours', 'pages', 'kg', etc.
  target_date DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create policies for goals
CREATE POLICY "Users can view their own goals" 
ON public.goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create goal_progress table for tracking progress over time
CREATE TABLE public.goal_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  progress_value NUMERIC NOT NULL,
  notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for goal_progress
CREATE POLICY "Users can view their own goal progress" 
ON public.goal_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goal progress" 
ON public.goal_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goal progress" 
ON public.goal_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goal progress" 
ON public.goal_progress 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add voice recording support to journals
ALTER TABLE public.journals ADD COLUMN audio_url TEXT;

-- Create storage bucket for voice recordings
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-recordings', 'voice-recordings', false);

-- Create policies for voice recordings storage
CREATE POLICY "Users can view their own voice recordings" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own voice recordings" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own voice recordings" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own voice recordings" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);