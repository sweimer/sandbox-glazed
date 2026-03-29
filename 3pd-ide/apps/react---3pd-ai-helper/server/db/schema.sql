CREATE TABLE IF NOT EXISTS history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT,
  prompt     TEXT NOT NULL,
  markup     TEXT NOT NULL,
  node_url   TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
