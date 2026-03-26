-- test_entries table
CREATE TABLE IF NOT EXISTS test_entries (
  id          SERIAL PRIMARY KEY,
  text_value  TEXT        NOT NULL,
  created_at  TIMESTAMP   DEFAULT NOW()
);

