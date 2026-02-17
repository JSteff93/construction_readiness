-- Profile avatar circle color (hex, used in nav and on task owner/assignee)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT '#166534';
