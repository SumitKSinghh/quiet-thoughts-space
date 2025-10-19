-- Add analysis field to goals table
ALTER TABLE public.goals 
ADD COLUMN analysis JSONB;