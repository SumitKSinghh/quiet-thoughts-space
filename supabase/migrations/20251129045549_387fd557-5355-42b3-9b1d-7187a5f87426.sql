-- Add is_public column to journals table to allow users to choose which journals to share
ALTER TABLE public.journals ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Create community_posts table for reposts/shares
CREATE TABLE public.community_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_journal_id uuid NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
  shared_by_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(original_journal_id, shared_by_user_id)
);

-- Enable RLS on community_posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Create post_likes table
CREATE TABLE public.post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id uuid NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(journal_id, user_id)
);

-- Enable RLS on post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Create post_comments table
CREATE TABLE public.post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_id uuid NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  comment_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on post_comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journals (allow public journals to be viewed by anyone)
CREATE POLICY "Public journals are viewable by everyone"
ON public.journals
FOR SELECT
USING (is_public = true OR auth.uid() = user_id);

-- RLS Policies for community_posts
CREATE POLICY "Anyone can view community posts"
ON public.community_posts
FOR SELECT
USING (true);

CREATE POLICY "Users can create their own community posts"
ON public.community_posts
FOR INSERT
WITH CHECK (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can delete their own community posts"
ON public.community_posts
FOR DELETE
USING (auth.uid() = shared_by_user_id);

-- RLS Policies for post_likes
CREATE POLICY "Anyone can view likes"
ON public.post_likes
FOR SELECT
USING (true);

CREATE POLICY "Users can like posts"
ON public.post_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
ON public.post_likes
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for post_comments
CREATE POLICY "Anyone can view comments"
ON public.post_comments
FOR SELECT
USING (true);

CREATE POLICY "Users can create comments"
ON public.post_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.post_comments
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.post_comments
FOR DELETE
USING (auth.uid() = user_id);