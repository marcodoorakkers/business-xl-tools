CREATE TABLE IF NOT EXISTS onedrive_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  archive_root TEXT NOT NULL DEFAULT 'Archief',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS archive_family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE onedrive_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_family_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own tokens" ON onedrive_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own family members" ON archive_family_members FOR ALL USING (auth.uid() = user_id);
