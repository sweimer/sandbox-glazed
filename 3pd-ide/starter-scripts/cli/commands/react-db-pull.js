/**
 * 3pd react db pull
 * File: commands/react-db-pull.js
 *
 * Pulls live data from the Drupal API endpoint on Pantheon (or any configured
 * Drupal URL) and writes it into the local app's SQLite database.
 *
 * Run from inside a react app folder:
 *   cd apps/<your-app>
 *   3pd react db pull
 *
 * What it does:
 *   1. Reads APP_SLUG and VITE_API_BASE_URL (or falls back to 3pd.config.json) from .env
 *   2. Detects table name from server/db/schema.sql
 *   3. Fetches GET {drupalUrl}/api/{appSlug}/{tableName}
 *   4. Writes the returned rows into server/db/app.sqlite
 *      (creates the DB if it doesn't exist; truncates before re-inserting)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { log } from '../shared/log.js';

// ---------------------------------------------------------------------------
// Simple .env parser — no dotenv dependency needed in the CLI.
// ---------------------------------------------------------------------------
function parseEnvFile(envPath) {
  const vars = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    vars[key] = val;
  }
  return vars;
}

export default async function reactDbPull({ ideRoot }) {
  const cwd     = process.cwd();
  const appName = path.basename(cwd);

  log.header('3PD React — DB Pull');

  // -------------------------------------------------------------------------
  // Assert we're inside an app folder
  // -------------------------------------------------------------------------
  if (!fs.existsSync(path.join(cwd, 'package.json'))) {
    log.error('Not inside an app folder. Run from apps/<your-app>/');
    log.nl();
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Read .env
  // -------------------------------------------------------------------------
  const envPath = path.join(cwd, '.env');
  if (!fs.existsSync(envPath)) {
    log.error('No .env file found in this directory.');
    process.exit(1);
  }
  const env = parseEnvFile(envPath);

  const appSlug = env.APP_SLUG || appName;

  // -------------------------------------------------------------------------
  // Determine Drupal URL — .env first (VITE_API_BASE_URL blank = same-origin
  // in production, so also check 3pd.config.json), then config fallback.
  // React uses VITE_ prefix instead of PUBLIC_.
  // -------------------------------------------------------------------------
  let drupalUrl = env.VITE_DRUPAL_BASE_URL || env.VITE_API_BASE_URL;
  if (!drupalUrl) {
    const configPath = path.join(ideRoot, '..', '3pd.config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      drupalUrl = config.pantheonUrl;
    }
  }
  if (!drupalUrl) {
    log.error('No Drupal URL found.');
    log.dim('Set VITE_DRUPAL_BASE_URL in .env or pantheonUrl in 3pd.config.json');
    process.exit(1);
  }
  drupalUrl = drupalUrl.replace(/\/$/, '');

  // -------------------------------------------------------------------------
  // Detect table name from server/db/schema.sql
  // -------------------------------------------------------------------------
  const schemaPath = path.join(cwd, 'server', 'db', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    log.error('server/db/schema.sql not found. Is this a react app?');
    process.exit(1);
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const tableMatch = schemaSql.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i);
  const tableName = tableMatch ? tableMatch[1] : 'submissions';

  const apiUrl = `${drupalUrl}/api/${appSlug}/${tableName}`;

  log.info(`App:    ${appName}`);
  log.info(`Slug:   ${appSlug}`);
  log.info(`Table:  ${tableName}`);
  log.info(`Source: ${apiUrl}`);
  log.nl();

  // -------------------------------------------------------------------------
  // Fetch rows from Drupal
  // -------------------------------------------------------------------------
  log.info('Fetching data from Drupal...');
  let rows;
  try {
    // Allow self-signed certs for local Lando URLs.
    const isLocal = apiUrl.includes('lndo.site') || apiUrl.includes('localhost');
    if (isLocal) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    const res = await fetch(apiUrl);
    if (isLocal) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1';
    if (!res.ok) {
      log.error(`HTTP ${res.status} — ${apiUrl}`);
      log.dim('Check that the module is installed on Pantheon and the route is active.');
      process.exit(1);
    }
    rows = await res.json();
  } catch (err) {
    log.error(`Fetch failed: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(rows)) {
    log.error('Unexpected response — expected a JSON array of rows.');
    log.dim(`Got: ${JSON.stringify(rows).slice(0, 120)}`);
    process.exit(1);
  }

  log.success(`Fetched ${rows.length} row(s).`);

  // -------------------------------------------------------------------------
  // Write rows into server/db/app.sqlite via a temp script.
  // Runs from the app directory so better-sqlite3 resolves from its node_modules.
  // -------------------------------------------------------------------------
  const dbDir  = path.join(cwd, 'server', 'db');
  const dbPath = path.join(dbDir, 'app.sqlite');
  fs.mkdirSync(dbDir, { recursive: true });

  // Exclude 'id' from explicit inserts — let SQLite assign fresh auto-increment IDs.
  const tempScript = `
import Database from 'better-sqlite3';
import fs from 'fs';

const dbPath    = ${JSON.stringify(dbPath)};
const rows      = ${JSON.stringify(rows)};
const tableName = ${JSON.stringify(tableName)};
const schemaSql = ${JSON.stringify(schemaSql)};

// Always start with a clean slate — delete the existing DB and any WAL/SHM files.
// We truncate and re-insert all rows anyway, so there's nothing to preserve.
// This also avoids SQLITE_IOERR_SHORT_READ from mismatched WAL/SHM after a crash.
for (const suffix of ['', '-shm', '-wal']) {
  const f = dbPath + suffix;
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Ensure table exists (idempotent)
db.exec(schemaSql);

// Truncate and re-insert
db.prepare('DELETE FROM ' + tableName).run();

if (rows.length > 0) {
  const cols = Object.keys(rows[0]).filter(c => c !== 'id');
  const placeholders = cols.map(() => '?').join(', ');
  const stmt = db.prepare(
    'INSERT INTO ' + tableName + ' (' + cols.join(', ') + ') VALUES (' + placeholders + ')'
  );
  const insertAll = db.transaction((items) => {
    for (const row of items) stmt.run(cols.map(c => row[c] ?? null));
  });
  insertAll(rows);
}

console.log('Wrote ' + rows.length + ' row(s) to ' + dbPath);
db.close();
`.trim();

  const tempPath = path.join(cwd, '.db-pull-temp.mjs');
  fs.writeFileSync(tempPath, tempScript);

  log.info('Writing to SQLite...');
  try {
    execSync(`node ${tempPath}`, { cwd, stdio: 'inherit' });
    log.success('server/db/app.sqlite updated.');
  } catch {
    log.error('Failed to write SQLite. Make sure dependencies are installed: npm install');
    process.exit(1);
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }

  log.nl();
  log.success('DB pull complete.');
  log.dim('If dev server is running: Ctrl+C, then lsof -ti:4000 | xargs kill -9, then npm run dev');
  log.dim('If not running:           npm run dev');
  log.nl();
}
