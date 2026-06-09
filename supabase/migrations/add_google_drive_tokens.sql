CREATE TABLE IF NOT EXISTS google_drive_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  archive_root TEXT NOT NULL DEFAULT 'MijnDossier',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE google_drive_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own google drive tokens" ON google_drive_tokens
  USING (auth.uid() = user_id);
