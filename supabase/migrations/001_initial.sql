-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  ecr_anxiety float NOT NULL DEFAULT 0,
  ecr_avoidance float NOT NULL DEFAULT 0,
  attachment_type text NOT NULL DEFAULT '',
  chat_history jsonb NOT NULL DEFAULT '[]',
  result jsonb,
  consent boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Couples table
CREATE TABLE IF NOT EXISTS couples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  partner_session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  invite_token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  expires_at timestamptz NOT NULL,
  couple_analysis jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_couples_invite_token ON couples(invite_token);
CREATE INDEX IF NOT EXISTS idx_couples_sender ON couples(sender_session_id);
