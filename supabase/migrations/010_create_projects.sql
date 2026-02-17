-- Projects: top-level container for packages, templates, and tasks
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Link packages and templates to projects
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_packages_project_id ON packages(project_id);
CREATE INDEX IF NOT EXISTS idx_templates_project_id ON templates(project_id);

-- Create default project LGCFR and assign all existing packages/templates to it
-- Uses the first user (by created_at) as owner; if no users exist, skip
DO $$
DECLARE
  v_project_id UUID;
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO projects (name, description, user_id)
    VALUES ('LGCFR', 'Default project', v_user_id)
    RETURNING id INTO v_project_id;
    UPDATE packages SET project_id = v_project_id WHERE project_id IS NULL;
    UPDATE templates SET project_id = v_project_id WHERE project_id IS NULL;
  END IF;
END $$;
