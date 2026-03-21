CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS broadcast_cycles (
  broadcast_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  state TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
