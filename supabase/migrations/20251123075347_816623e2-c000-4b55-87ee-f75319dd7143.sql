-- Drop the insufficient policy
DROP POLICY IF EXISTS "Users can view public profile info" ON public.profiles;

-- Create a comprehensive policy that properly handles comment visibility
CREATE POLICY "Users can view profiles in their complaint threads"
ON public.profiles
FOR SELECT
USING (
  -- Users can see their own profile
  auth.uid() = id
  OR
  -- Admins can see all profiles  
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Users can see profiles of people who commented on complaints they have access to
  id IN (
    SELECT DISTINCT c.user_id
    FROM comments c
    INNER JOIN complaints comp ON c.complaint_id = comp.id
    WHERE comp.student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)
  )
  OR
  -- Users can see profiles of complaint owners where they've commented
  id IN (
    SELECT DISTINCT comp.student_id
    FROM comments c
    INNER JOIN complaints comp ON c.complaint_id = comp.id  
    WHERE c.user_id = auth.uid()
  )
);