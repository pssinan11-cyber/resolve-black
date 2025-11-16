-- Fix user_roles RLS policy to prevent role enumeration
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Fix profiles RLS policy to restrict visibility
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix update_updated_at() function to include fixed search_path
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;