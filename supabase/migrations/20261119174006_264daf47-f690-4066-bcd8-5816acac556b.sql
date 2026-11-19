CREATE TABLE public.typing_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  passage_title text NOT NULL,
  passage_category text NOT NULL,
  passage_text text NOT NULL,
  words_per_minute integer NOT NULL,
  accuracy numeric NOT NULL,
  characters_typed integer NOT NULL,
  error_count integer NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 60,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.typing_test_results TO authenticated;
GRANT ALL ON public.typing_test_results TO service_role;
ALTER TABLE public.typing_test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own typing results and shared results" ON public.typing_test_results FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_shared = true);
CREATE POLICY "Users can create own typing results" ON public.typing_test_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own typing results" ON public.typing_test_results FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own typing results" ON public.typing_test_results FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER update_typing_test_results_updated_at BEFORE UPDATE ON public.typing_test_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();