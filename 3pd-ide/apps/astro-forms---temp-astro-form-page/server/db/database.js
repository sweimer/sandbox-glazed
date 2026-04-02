/**
 * SQLite connection via better-sqlite3.
 *
 * Singleton pattern — one DB connection shared across all requests.
 * Schema is applied on first open via CREATE TABLE IF NOT EXISTS,
 * so the database and tables are created automatically if missing.
 *
 * DB_PATH env var controls the file location:
 *   Dev:  ./server/db/app.sqlite  (default, relative to app root)
 *   Prod: /var/app-data/<appname>/app.sqlite  (absolute, outside web root)
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve DB path — process.cwd() is the app root when running via npm script.
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.cwd(), process.env.DB_PATH)
  : path.join(__dirname, 'app.sqlite');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);

    // WAL mode: allows concurrent reads while a write is in progress.
    db.pragma('journal_mode = WAL');

    // Apply schema — idempotent, safe to run on every startup.
    const schema = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.exec(schema);

    console.log(`SQLite connected: ${DB_PATH}`);
  }
  return db;
}
