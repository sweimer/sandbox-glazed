CREATE TABLE IF NOT EXISTS test_entries (
  id SERIAL PRIMARY KEY,
  text_value TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
