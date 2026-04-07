-- App-level settings table (key/value, extensible)
CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed defaults
INSERT INTO app_settings (key, value, description) VALUES
  ('chat_max_turns', '6', '채팅 최대 턴 수 (1–20)')
ON CONFLICT (key) DO NOTHING;
