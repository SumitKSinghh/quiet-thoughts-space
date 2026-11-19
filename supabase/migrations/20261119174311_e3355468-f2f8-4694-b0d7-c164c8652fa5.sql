REVOKE ALL ON TABLE public.typing_test_results FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_typing_test_results()
RETURNS SETOF public.typing_test_results
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT * FROM public.typing_test_results
  WHERE user_id = auth.uid() OR is_shared = true
  ORDER BY created_at DESC
$$;

CREATE OR REPLACE FUNCTION public.create_typing_test_result(
  p_passage_title text,
  p_passage_category text,
  p_passage_text text,
  p_words_per_minute integer,
  p_accuracy numeric,
  p_characters_typed integer,
  p_error_count integer,
  p_duration_seconds integer DEFAULT 60
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  INSERT INTO public.typing_test_results (
    user_id, passage_title, passage_category, passage_text,
    words_per_minute, accuracy, characters_typed, error_count, duration_seconds
  ) VALUES (
    auth.uid(), p_passage_title, p_passage_category, p_passage_text,
    p_words_per_minute, p_accuracy, p_characters_typed, p_error_count, p_duration_seconds
  ) RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_typing_test_shared(p_result_id uuid, p_is_shared boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  UPDATE public.typing_test_results
  SET is_shared = p_is_shared, updated_at = now()
  WHERE id = p_result_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.get_typing_test_results() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_typing_test_result(text, text, text, integer, numeric, integer, integer, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_typing_test_shared(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_typing_test_results() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_typing_test_result(text, text, text, integer, numeric, integer, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_typing_test_shared(uuid, boolean) TO authenticated;