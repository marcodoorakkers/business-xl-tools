-- Founding member invite codes fm01–fm25
-- Elk eenmalig bruikbaar, 180 dagen trial, zelfde voordelen als founding25
INSERT INTO promo_codes (code, max_uses, uses, trial_days, active)
VALUES
  ('fm01', 1, 0, 180, true),
  ('fm02', 1, 0, 180, true),
  ('fm03', 1, 0, 180, true),
  ('fm04', 1, 0, 180, true),
  ('fm05', 1, 0, 180, true),
  ('fm06', 1, 0, 180, true),
  ('fm07', 1, 0, 180, true),
  ('fm08', 1, 0, 180, true),
  ('fm09', 1, 0, 180, true),
  ('fm10', 1, 0, 180, true),
  ('fm11', 1, 0, 180, true),
  ('fm12', 1, 0, 180, true),
  ('fm13', 1, 0, 180, true),
  ('fm14', 1, 0, 180, true),
  ('fm15', 1, 0, 180, true),
  ('fm16', 1, 0, 180, true),
  ('fm17', 1, 0, 180, true),
  ('fm18', 1, 0, 180, true),
  ('fm19', 1, 0, 180, true),
  ('fm20', 1, 0, 180, true),
  ('fm21', 1, 0, 180, true),
  ('fm22', 1, 0, 180, true),
  ('fm23', 1, 0, 180, true),
  ('fm24', 1, 0, 180, true),
  ('fm25', 1, 0, 180, true)
ON CONFLICT (code) DO NOTHING;
