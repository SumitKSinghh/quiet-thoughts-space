DROP FUNCTION public.get_typing_test_results();
DROP FUNCTION public.create_typing_test_result(text, text, text, integer, numeric, integer, integer, integer);
DROP FUNCTION public.set_typing_test_shared(uuid, boolean);
REVOKE ALL ON TABLE public.typing_test_results FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.typing_test_results TO authenticated;
GRANT ALL ON TABLE public.typing_test_results TO service_role;