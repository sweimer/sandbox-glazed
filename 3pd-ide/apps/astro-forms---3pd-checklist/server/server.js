/**
 * Express API server — 3PD Module Checklist
 *
 * Three routes, all namespaced under /api/${APP_SLUG}/:
 *
 *   GET  /api/${APP_SLUG}/modules   — scan apps/ dir, return list of 3PD modules
 *   GET  /api/${APP_SLUG}/checklist — return all checklist rows from SQLite
 *   POST /api/${APP_SLUG}/checklist — upsert a row by module_name
 *
 * In production this server is NOT used — Drupal's ChecklistController handles
 * these routes instead. The Express server is for local 3PD dev workflow only.
 *
 * Dev:  npm run dev:server  (localhost:PORT)
 * Prod: Drupal module serves all three routes natively.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app      = express();
const PORT     = process.env.PORT     || 3001;
const HOST     = process.env.HOST     || '127.0.0.1';
const APP_SLUG = process.env.APP_SLUG || 'astro-forms---3pd-checklist';

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4321',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// -----------------------------------------------------------------------
// Detect 3PD apps from the apps/ directory.
// Maps folder prefixes to tech type labels.
// Skips starter kits (0.*) and the checklist app itself.
// -----------------------------------------------------------------------
const TECH_PREFIXES = {
  'react---':       'React',
  'astro-forms---': 'Astro Forms',
  'astro---':       'Astro',
};

function detectApps() {
  // server/server.js is inside the app dir; apps/ is two levels up.
  const appsDir = path.resolve(__dirname, '..', '..');
  if (!fs.existsSync(appsDir)) return [];

  return fs.readdirSync(appsDir)
    .filter(name => !name.startsWith('0.') && !name.startsWith('.') && name !== `astro-forms---3pd-checklist`)
    .flatMap(name => {
      for (const [prefix, techType] of Object.entries(TECH_PREFIXES)) {
        if (name.startsWith(prefix)) {
          return [{
            module_name:  name,
            tech_type:    techType,
            display_name: name.slice(prefix.length),
          }];
        }
      }
      return [];
    });
}

// -----------------------------------------------------------------------
// GET /api/${APP_SLUG}/modules — list of known 3PD apps
// -----------------------------------------------------------------------
app.get(`/api/${APP_SLUG}/modules`, (req, res) => {
  res.json(detectApps());
});

// -----------------------------------------------------------------------
// GET /api/${APP_SLUG}/checklist — all checklist rows
// -----------------------------------------------------------------------
app.get(`/api/${APP_SLUG}/checklist`, (req, res) => {
  const rows = getDb()
    .prepare('SELECT * FROM checklist ORDER BY id ASC')
    .all();
  res.json(rows);
});

// -----------------------------------------------------------------------
// POST /api/${APP_SLUG}/checklist — upsert a row by module_name
// -----------------------------------------------------------------------
app.post(`/api/${APP_SLUG}/checklist`, (req, res) => {
  const { module_name, tech_type, display_name, checked, tester_name } = req.body ?? {};

  if (!module_name) {
    return res.status(400).json({ error: 'module_name is required' });
  }

  const db         = getDb();
  const isChecked  = checked ? 1 : 0;
  const checked_at = (isChecked && tester_name?.trim())
    ? new Date().toISOString().slice(0, 19).replace('T', ' ')
    : '';

  db.prepare(`
    INSERT INTO checklist (module_name, tech_type, display_name, checked, tester_name, checked_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(module_name) DO UPDATE SET
      tech_type    = excluded.tech_type,
      display_name = excluded.display_name,
      checked      = excluded.checked,
      tester_name  = excluded.tester_name,
      checked_at   = excluded.checked_at
  `).run(
    module_name,
    tech_type    || '',
    display_name || '',
    isChecked,
    tester_name  || '',
    checked_at,
  );

  const row = db.prepare('SELECT * FROM checklist WHERE module_name = ?').get(module_name);
  res.status(200).json(row);
});

// -----------------------------------------------------------------------
// Start
// -----------------------------------------------------------------------
app.listen(PORT, HOST, () => {
  console.log(`API server running at http://${HOST}:${PORT}`);
  console.log(`  GET  http://${HOST}:${PORT}/api/${APP_SLUG}/modules`);
  console.log(`  GET  http://${HOST}:${PORT}/api/${APP_SLUG}/checklist`);
  console.log(`  POST http://${HOST}:${PORT}/api/${APP_SLUG}/checklist`);
});
