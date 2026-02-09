-- Add status column to tasks table
-- Allowed values: Pending, In Progress, Waiting, Complete, Delegated
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
