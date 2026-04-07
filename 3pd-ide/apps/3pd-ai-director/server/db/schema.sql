CREATE TABLE IF NOT EXISTS requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT,
  email       TEXT,
  summary     TEXT,
  route       TEXT,
  conversation TEXT,
  status      TEXT DEFAULT 'Needs Review',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
