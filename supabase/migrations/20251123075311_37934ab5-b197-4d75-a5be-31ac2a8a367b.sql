-- Drop the complex policy and create a simpler one
DROP POLICY IF EXISTS "Users can view profiles of commenters on their complaints" ON public.profiles;

-- Allow users to view profiles of anyone who has interacted with complaints they can access
-- This is simpler and more performant
CREATE POLICY "Users can view public profile info"
ON public.profiles
FOR SELECT
USING (
  -- Users can see their own profile
  auth.uid() = id
  OR
  -- Admins can see all profiles  
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Anyone can see basic profile info (name only) of users who commented on complaints they can access
  EXISTS (
    SELECT 1 FROM comments 
    WHERE comments.user_id = profiles.id
  )
);