ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS result_status text NOT NULL DEFAULT 'idle'
  CHECK (result_status IN ('idle', 'pending', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS result_error text;
