/**
 * Express API server — handles contact form submissions, reads from SQLite.
 *
 * Routes:
 *   GET  /api/${APP_SLUG}/submissions  → list all submissions (newest first)
 *   POST /api/${APP_SLUG}/submissions  → save a new submission
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getDb } from './db/database.js';

const app      = express();
const PORT     = process.env.PORT     || 3001;
const HOST     = process.env.HOST     || '127.0.0.1';
const APP_SLUG = process.env.APP_SLUG || 'app';

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4321',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// -----------------------------------------------------------------------
// GET /api/${APP_SLUG}/submissions — return all submissions, newest first
// -----------------------------------------------------------------------
app.get(`/api/${APP_SLUG}/submissions`, (req, res) => {
  const rows = getDb()
    .prepare('SELECT * FROM submissions ORDER BY created_at DESC')
    .all();
  res.json(rows);
});

// -----------------------------------------------------------------------
// POST /api/${APP_SLUG}/submissions — save a new submission
// -----------------------------------------------------------------------
app.post(`/api/${APP_SLUG}/submissions`, (req, res) => {
  const { first_name, last_name, email, topic, message } = req.body ?? {};

  if (!first_name?.trim() || !last_name?.trim() || !email?.trim() || !topic?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const db     = getDb();
  const result = db
    .prepare('INSERT INTO submissions (first_name, last_name, email, topic, message) VALUES (?, ?, ?, ?, ?)')
    .run(first_name.trim(), last_name.trim(), email.trim(), topic.trim(), message.trim());

  const row = db
    .prepare('SELECT * FROM submissions WHERE id = ?')
    .get(result.lastInsertRowid);

  res.status(201).json(row);
});

// -----------------------------------------------------------------------
// GET /api/${APP_SLUG}/menu/:menuName — return menu items from menu.json
// -----------------------------------------------------------------------
app.get(`/api/${APP_SLUG}/menu/:menuName`, (req, res) => {
  try {
    const menuFile = resolve(process.cwd(), 'server', 'menu.json');
    const menus    = JSON.parse(readFileSync(menuFile, 'utf8'));
    const items    = menus[req.params.menuName] || [];
    res.json(items);
  } catch {
    res.json([]);
  }
});

// -----------------------------------------------------------------------
// Start
// -----------------------------------------------------------------------
app.listen(PORT, HOST, () => {
  console.log(`API server running at http://${HOST}:${PORT}`);
  console.log(`  GET  http://${HOST}:${PORT}/api/${APP_SLUG}/submissions`);
  console.log(`  POST http://${HOST}:${PORT}/api/${APP_SLUG}/submissions`);
});
