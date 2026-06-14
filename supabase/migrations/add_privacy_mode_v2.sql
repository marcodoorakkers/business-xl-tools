ALTER TABLE archive_settings
  ALTER COLUMN privacy_mode TYPE text
  USING CASE WHEN privacy_mode THEN 'minimal' ELSE 'full' END;

ALTER TABLE archive_settings ALTER COLUMN privacy_mode SET DEFAULT 'full';
