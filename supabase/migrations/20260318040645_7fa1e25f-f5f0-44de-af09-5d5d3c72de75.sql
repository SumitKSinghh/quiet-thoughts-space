
-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Edge function to get all users (admin only) - we'll need an RPC
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE(
  id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.id,
    au.email::text,
    au.created_at,
    au.last_sign_in_at
  FROM auth.users au
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY au.created_at DESC
$$;

-- Admin function to update subscription status
CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  _subscription_id uuid,
  _status subscription_status
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  UPDATE public.subscriptions
  SET status = _status, updated_at = now()
  WHERE id = _subscription_id;
END;
$$;

-- Admin function to get all subscriptions
CREATE OR REPLACE FUNCTION public.admin_get_all_subscriptions()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  user_email text,
  plan subscription_plan,
  status subscription_status,
  amount integer,
  currency text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.user_id,
    au.email::text as user_email,
    s.plan,
    s.status,
    s.amount,
    s.currency,
    s.starts_at,
    s.ends_at,
    s.created_at
  FROM public.subscriptions s
  LEFT JOIN auth.users au ON au.id = s.user_id
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY s.created_at DESC
$$;
