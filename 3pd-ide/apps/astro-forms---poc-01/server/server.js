/**
 * Express API server — handles form submissions, reads from SQLite.
 *
 * This server is NOT packaged into the Drupal module.
 * It runs separately alongside Drupal on the same server.
 *
 * Dev:  npm run dev:server  (runs on localhost:PORT)
 * Prod: managed by PM2 or systemd, behind the same reverse proxy as Drupal.
 *       Reverse proxy routes /api/<appname>/ → this server.
 *       Listens on 127.0.0.1 only — not publicly accessible.
 *
 * Routes:
 *   GET  /api/submissions     → list all submissions (newest first)
 *   POST /api/submissions     → create a new submission
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getDb } from './db/database.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// In production this server listens on 127.0.0.1 only — it is not a public
// service. The reverse proxy (nginx/Apache) routes /api/ paths to it.
// In dev, 127.0.0.1 also works fine since Astro dev server is on the same machine.
const HOST = process.env.HOST || '127.0.0.1';

// CORS — in dev the Astro dev server (port 4321) is a different origin.
// In production both run behind the same proxy on the same domain, so CORS
// headers are not needed, but they don't hurt.
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4321',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// -----------------------------------------------------------------------
// GET /api/submissions — return all submissions, newest first
// -----------------------------------------------------------------------
app.get('/api/submissions', (req, res) => {
  const rows = getDb()
    .prepare('SELECT * FROM submissions ORDER BY created_at DESC')
    .all();
  res.json(rows);
});

// -----------------------------------------------------------------------
// POST /api/submissions — save a new submission
// -----------------------------------------------------------------------
app.post('/api/submissions', (req, res) => {
  const { name, message } = req.body ?? {};

  if (!name?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'name and message are required' });
  }

  const db     = getDb();
  const result = db
    .prepare('INSERT INTO submissions (name, message) VALUES (?, ?)')
    .run(name.trim(), message.trim());

  const row = db
    .prepare('SELECT * FROM submissions WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json(row);
});

// -----------------------------------------------------------------------
// Start
// -----------------------------------------------------------------------
app.listen(PORT, HOST, () => {
  console.log(`API server running at http://${HOST}:${PORT}`);
  console.log(`  GET  http://${HOST}:${PORT}/api/submissions`);
  console.log(`  POST http://${HOST}:${PORT}/api/submissions`);
});
