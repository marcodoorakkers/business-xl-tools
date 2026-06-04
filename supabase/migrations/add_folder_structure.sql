ALTER TABLE archive_settings
  ADD COLUMN IF NOT EXISTS folder_structure TEXT NOT NULL DEFAULT 'by_subject';
