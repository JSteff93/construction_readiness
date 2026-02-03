-- Create categories table (for template categories)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  template_id TEXT,
  package_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_date TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  lead_review_time INTEGER, -- in days
  template_id TEXT,
  package_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_id TEXT NOT NULL,
  expected_start_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

-- Add foreign key constraints for categories
ALTER TABLE categories
  ADD CONSTRAINT fk_category_template FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_category_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE;

-- Add foreign key constraints for tasks
ALTER TABLE tasks
  ADD CONSTRAINT fk_task_template FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_task_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_template_id ON categories(template_id);
CREATE INDEX IF NOT EXISTS idx_categories_package_id ON categories(package_id);
CREATE INDEX IF NOT EXISTS idx_tasks_template_id ON tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_tasks_package_id ON tasks(package_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category_id ON tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_packages_template_id ON packages(template_id);

-- Enable Row Level Security (RLS) - for now, allow all operations
-- You can customize this later based on your authentication needs
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on templates" ON templates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on packages" ON packages
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on categories" ON categories
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);
