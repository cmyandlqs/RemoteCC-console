import Database from "better-sqlite3";

const MIGRATIONS_SQL = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL UNIQUE,
  is_git_repo INTEGER NOT NULL DEFAULT 0,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  external_session_id TEXT,
  name TEXT,
  status TEXT NOT NULL CHECK(status IN ('idle','running','waiting_approval','error','completed','stopped','disconnected')),
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_cost_usd TEXT,
  context_window INTEGER,
  last_error TEXT,
  started_at TEXT,
  last_active_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  tool_use_id TEXT,
  tool_name TEXT NOT NULL,
  description TEXT,
  payload_json TEXT,
  allowed_actions_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','dismissed')),
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS file_changes (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  path TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK(change_type IN ('added','modified','deleted','renamed')),
  additions INTEGER,
  deletions INTEGER,
  diff_excerpt TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS device_bindings (
  id TEXT PRIMARY KEY,
  device_name TEXT,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
  created_at TEXT NOT NULL,
  last_used_at TEXT
);

CREATE TABLE IF NOT EXISTS session_messages (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  role TEXT NOT NULL CHECK(role IN ('user','assistant')),
  kind TEXT NOT NULL CHECK(kind IN ('text','thinking','user')),
  content TEXT NOT NULL,
  seq INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_project_id ON sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_events_session_id ON session_events(session_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_session_id ON approval_requests(session_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_file_changes_session_id ON file_changes(session_id);
CREATE INDEX IF NOT EXISTS idx_file_changes_project_id ON file_changes(project_id);
CREATE INDEX IF NOT EXISTS idx_device_bindings_status ON device_bindings(status);
CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_session_seq ON session_messages(session_id, seq);
`;

export function runMigrations(db: Database.Database): void {
  db.exec(MIGRATIONS_SQL);
}
