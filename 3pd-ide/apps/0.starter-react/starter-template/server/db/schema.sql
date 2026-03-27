CREATE TABLE IF NOT EXISTS test_entries (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  text_value  TEXT    NOT NULL,
  created_at  TEXT    DEFAULT (datetime('now'))
);
