ALTER TABLE archive_settings ADD COLUMN IF NOT EXISTS auto_crop boolean NOT NULL DEFAULT true;
