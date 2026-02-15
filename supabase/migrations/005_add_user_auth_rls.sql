-- Add user_id to templates and packages for multi-tenant auth
-- NOTE: Existing rows with NULL user_id will not be visible after this migration.
-- To assign existing data to a user, run in SQL editor (replace YOUR_USER_UUID):
--   UPDATE templates SET user_id = 'YOUR_USER_UUID' WHERE user_id IS NULL;
--   UPDATE packages SET user_id = 'YOUR_USER_UUID' WHERE user_id IS NULL;
ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for RLS performance
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_user_id ON packages(user_id);

-- Drop existing permissive policies (if any) and create user-scoped RLS
-- Templates: users see only their own
DROP POLICY IF EXISTS "Allow all operations on templates" ON templates;
CREATE POLICY "Users can view own templates"
  ON templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON templates FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON templates FOR DELETE
  USING (auth.uid() = user_id);

-- Packages: users see only their own
DROP POLICY IF EXISTS "Allow all operations on packages" ON packages;
CREATE POLICY "Users can view own packages"
  ON packages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own packages"
  ON packages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own packages"
  ON packages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own packages"
  ON packages FOR DELETE
  USING (auth.uid() = user_id);

-- Categories: access via template_id or package_id (join through templates/packages)
DROP POLICY IF EXISTS "Allow all operations on categories" ON categories;
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (
    (template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM templates t WHERE t.id = categories.template_id AND t.user_id = auth.uid()
    ))
    OR
    (package_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM packages p WHERE p.id = categories.package_id AND p.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (
    (template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM templates t WHERE t.id = categories.template_id AND t.user_id = auth.uid()
    ))
    OR
    (package_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM packages p WHERE p.id = categories.package_id AND p.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (
    (template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM templates t WHERE t.id = categories.template_id AND t.user_id = auth.uid()
    ))
    OR
    (package_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM packages p WHERE p.id = categories.package_id AND p.user_id = auth.uid()
    ))
  )
  WITH CHECK (
    (template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM templates t WHERE t.id = categories.template_id AND t.user_id = auth.uid()
    ))
    OR
    (package_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM packages p WHERE p.id = categories.package_id AND p.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (
    (template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM templates t WHERE t.id = categories.template_id AND t.user_id = auth.uid()
    ))
    OR
    (package_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM packages p WHERE p.id = categories.package_id AND p.user_id = auth.uid()
    ))
  );

-- Tasks: access via template_id or package_id
DROP POLICY IF EXISTS "Allow all operations on tasks" ON tasks;
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (
    (template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM templates t WHERE t.id = tasks.template_id AND t.user_id = auth.uid()
    ))
    OR
    (package_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM packages p WHERE p.id = tasks.package_id AND p.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    (template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM templates t WHERE t.id = tasks.template_id AND t.user_id = auth.uid()
    ))
    OR
    (package_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM packages p WHERE p.id = tasks.package_id AND p.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (
    (template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM templates t WHERE t.id = tasks.template_id AND t.user_id = auth.uid()
    ))
    OR
    (package_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM packages p WHERE p.id = tasks.package_id AND p.user_id = auth.uid()
    ))
  )
  WITH CHECK (
    (template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM templates t WHERE t.id = tasks.template_id AND t.user_id = auth.uid()
    ))
    OR
    (package_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM packages p WHERE p.id = tasks.package_id AND p.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (
    (template_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM templates t WHERE t.id = tasks.template_id AND t.user_id = auth.uid()
    ))
    OR
    (package_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM packages p WHERE p.id = tasks.package_id AND p.user_id = auth.uid()
    ))
  );
