-- Remove 'closed' from complaint_status enum

-- Step 1: Drop ALL dependent RLS policies
DROP POLICY IF EXISTS "Students can update own complaints" ON complaints;
DROP POLICY IF EXISTS "Students can insert own ratings" ON ratings;

-- Step 2: Drop the default value constraint
ALTER TABLE complaints ALTER COLUMN status DROP DEFAULT;

-- Step 3: Create new enum without 'closed'
CREATE TYPE complaint_status_new AS ENUM ('pending', 'in_progress', 'resolved');

-- Step 4: Update complaints table to use new enum
ALTER TABLE complaints 
  ALTER COLUMN status TYPE complaint_status_new 
  USING status::text::complaint_status_new;

-- Step 5: Drop old enum and rename
DROP TYPE complaint_status;
ALTER TYPE complaint_status_new RENAME TO complaint_status;

-- Step 6: Restore default value
ALTER TABLE complaints ALTER COLUMN status SET DEFAULT 'pending'::complaint_status;

-- Step 7: Recreate RLS policies
CREATE POLICY "Students can update own complaints"
ON complaints
FOR UPDATE
TO authenticated
USING (student_id = auth.uid() AND status = 'pending'::complaint_status);

CREATE POLICY "Students can insert own ratings"
ON ratings
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid() AND
  EXISTS (
    SELECT 1
    FROM complaints
    WHERE complaints.id = ratings.complaint_id
      AND complaints.student_id = auth.uid()
      AND complaints.status = 'resolved'::complaint_status
  )
);