-- Voer dit uit in de Supabase SQL editor
ALTER TABLE document_actions
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- Index voor de cron query
CREATE INDEX IF NOT EXISTS document_actions_reminder
  ON document_actions (deadline, status, reminder_sent_at)
  WHERE status = 'open' AND reminder_sent_at IS NULL;
