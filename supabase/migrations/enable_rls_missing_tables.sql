-- Ontbrekende RLS op tabellen die alleen via service role worden benaderd
ALTER TABLE onboarding_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_rate_limits ENABLE ROW LEVEL SECURITY;
