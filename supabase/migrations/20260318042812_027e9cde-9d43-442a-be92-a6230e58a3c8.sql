INSERT INTO public.user_roles (user_id, role)
VALUES ('f6e7b0a8-5174-4bc0-8428-a4223f172155', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;