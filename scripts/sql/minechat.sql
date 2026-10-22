-- Additive migration. Existing Minechat users, servers and hooks are preserved.
CREATE TABLE IF NOT EXISTS minechat_credentials (
  server_id text PRIMARY KEY REFERENCES minechat_servers(server_id) ON DELETE CASCADE,
  secret_hash text NOT NULL
);

CREATE TABLE IF NOT EXISTS minechat_pairings (
  token_hash text PRIMARY KEY,
  kind text NOT NULL,
  subject text NOT NULL,
  server_id text NOT NULL REFERENCES minechat_servers(server_id) ON DELETE CASCADE,
  mc_name text,
  expires timestamptz NOT NULL,
  CONSTRAINT minechat_pairings_kind_subject_unique UNIQUE (kind, subject)
);
