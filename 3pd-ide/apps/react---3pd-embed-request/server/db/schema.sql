CREATE TABLE IF NOT EXISTS submissions (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Submitter
  submitter_name      TEXT NOT NULL,
  submitter_email     TEXT NOT NULL,
  submitter_dept      TEXT,
  -- Submission
  type                TEXT NOT NULL DEFAULT 'embed',
  title               TEXT NOT NULL,
  description         TEXT,
  justification       TEXT,
  url                 TEXT,
  code_snippet        TEXT,
  requested_placement TEXT,
  -- Governance
  data_sensitivity    TEXT DEFAULT 'public',
  collects_user_data  INTEGER DEFAULT 0,
  requires_auth       INTEGER DEFAULT 0,
  go_live_date        TEXT,
  -- Admin (set server-side, not by submitter)
  status              TEXT DEFAULT 'pending',
  admin_notes         TEXT,
  created_at          TEXT DEFAULT (datetime('now'))
);
