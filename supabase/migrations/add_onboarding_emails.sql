-- Bijhouden welke onboarding-e-mails al verstuurd zijn
CREATE TABLE IF NOT EXISTS onboarding_emails (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL, -- 'welcome' | 'day3' | 'trial_ending'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, email_type)
);
