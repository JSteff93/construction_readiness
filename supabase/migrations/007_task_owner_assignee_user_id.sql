-- Task owner and assignee are now profile/user references (UUID) instead of text names.
-- Add new columns and set all to the given user_id.
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS task_owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS task_assignee_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Set all existing tasks to the specified user
UPDATE tasks
SET task_owner_user_id = 'df028814-9102-417a-b106-b6e5e25c27b1',
    task_assignee_user_id = 'df028814-9102-417a-b106-b6e5e25c27b1'
WHERE task_owner_user_id IS NULL OR task_assignee_user_id IS NULL;

-- Drop old text columns (if they exist)
ALTER TABLE tasks DROP COLUMN IF EXISTS task_owner;
ALTER TABLE tasks DROP COLUMN IF EXISTS task_assignee;

-- Allow authenticated users to read all profiles (for showing task owner/assignee initials)
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);
