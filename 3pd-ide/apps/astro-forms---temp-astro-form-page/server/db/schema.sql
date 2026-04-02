-- Contact form submissions for AlexRenew demo.
-- Schema auto-applied on server startup via CREATE TABLE IF NOT EXISTS.
-- To change schema: delete server/db/app.sqlite and restart the dev server.

CREATE TABLE IF NOT EXISTS submissions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT    NOT NULL,
  last_name  TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  topic      TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
