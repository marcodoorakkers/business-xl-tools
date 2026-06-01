ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS scan_email_token UUID DEFAULT gen_random_uuid();

-- Backfill bestaande gebruikers
UPDATE profiles
  SET scan_email_token = gen_random_uuid()
  WHERE scan_email_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_scan_email_token_idx
  ON profiles (scan_email_token);
