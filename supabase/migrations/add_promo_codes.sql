CREATE TABLE IF NOT EXISTS promo_codes (
  code       TEXT PRIMARY KEY,
  max_uses   INTEGER NOT NULL,
  uses       INTEGER DEFAULT 0,
  trial_days INTEGER NOT NULL,
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Founding 25 promo: 6 maanden gratis, max 25 gebruikers
INSERT INTO promo_codes (code, max_uses, trial_days)
VALUES ('founding25', 25, 180)
ON CONFLICT (code) DO NOTHING;
