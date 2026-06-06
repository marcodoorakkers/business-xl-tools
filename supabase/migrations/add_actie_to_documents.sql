ALTER TABLE documents ADD COLUMN IF NOT EXISTS actie text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS actie_gedaan boolean NOT NULL DEFAULT false;
