-- Add policy to allow users to view profiles of people who comment on their complaints
CREATE POLICY "Users can view profiles of commenters on their complaints"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM comments c
    JOIN complaints comp ON c.complaint_id = comp.id
    WHERE c.user_id = profiles.id
      AND (comp.student_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
  )
);