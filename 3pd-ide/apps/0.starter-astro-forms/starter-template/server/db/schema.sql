-- Submissions table — stores form entries from the Astro app.
-- This schema is run automatically on server startup via CREATE TABLE IF NOT EXISTS,
-- so there is no separate migration step needed in development.
--
-- To add fields: add columns here AND update server.js GET/POST handlers.

CREATE TABLE IF NOT EXISTS submissions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
