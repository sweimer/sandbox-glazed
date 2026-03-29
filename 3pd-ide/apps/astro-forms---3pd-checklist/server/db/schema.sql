-- Checklist table — one row per 3PD module, persists test sign-off state.
-- Schema is applied automatically on server startup via CREATE TABLE IF NOT EXISTS.
--
-- module_name  — canonical folder name, e.g. "react---3pd-depot" (UNIQUE key)
-- tech_type    — "React" | "Astro Forms" | "Astro"
-- display_name — human label, e.g. "3pd-depot"
-- checked      — 1 = tested/approved, 0 = not yet tested
-- tester_name  — name of the person who signed off
-- checked_at   — ISO timestamp of when it was checked off

CREATE TABLE IF NOT EXISTS checklist (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  module_name  TEXT    NOT NULL UNIQUE,
  tech_type    TEXT    NOT NULL DEFAULT '',
  display_name TEXT    NOT NULL DEFAULT '',
  checked      INTEGER NOT NULL DEFAULT 0,
  tester_name  TEXT    NOT NULL DEFAULT '',
  checked_at   TEXT    NOT NULL DEFAULT ''
);
