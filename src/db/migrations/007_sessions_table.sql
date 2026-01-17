-- Sessions table for persistent session storage
-- This allows admin sessions to survive server restarts

CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(255) PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_sessions_expire ON sessions(expire);
