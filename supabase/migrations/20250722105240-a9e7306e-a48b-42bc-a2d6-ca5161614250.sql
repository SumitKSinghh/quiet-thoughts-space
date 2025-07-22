-- Create enum for journal types
CREATE TYPE public.journal_type AS ENUM ('gratitude', 'fitness', 'dreams', 'daily');

-- Create enum for moods
CREATE TYPE public.mood_type AS ENUM ('excellent', 'good', 'neutral', 'bad', 'terrible');

-- Add journal_type and mood columns to journals table
ALTER TABLE public.journals 
ADD COLUMN journal_type public.journal_type NOT NULL DEFAULT 'daily',
ADD COLUMN mood public.mood_type;