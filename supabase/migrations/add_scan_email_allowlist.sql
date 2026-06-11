CREATE TABLE scan_email_allowlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, email)
);

ALTER TABLE scan_email_allowlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own allowlist"
  ON scan_email_allowlist FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
