CREATE TABLE IF NOT EXISTS dropbox_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  archive_root TEXT NOT NULL DEFAULT 'Archief',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS archive_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_preference TEXT NOT NULL DEFAULT 'local',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dropbox_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own dropbox tokens" ON dropbox_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own archive settings" ON archive_settings FOR ALL USING (auth.uid() = user_id);
