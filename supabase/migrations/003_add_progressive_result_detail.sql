ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS result_detail jsonb,
ADD COLUMN IF NOT EXISTS result_detail_status text NOT NULL DEFAULT 'idle'
  CHECK (result_detail_status IN ('idle', 'pending', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS result_detail_error text;
