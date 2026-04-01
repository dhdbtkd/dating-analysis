ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS warmup_answers jsonb NOT NULL DEFAULT '[]',
ADD COLUMN IF NOT EXISTS quiz_details jsonb NOT NULL DEFAULT '[]';
