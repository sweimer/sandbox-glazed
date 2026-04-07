import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH   = process.env.DB_PATH || path.join(__dirname, 'app.sqlite');
const SCHEMA    = path.join(__dirname, 'schema.sql');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(fs.readFileSync(SCHEMA, 'utf8'));

// Migrations — safe to run on existing DBs
try { db.exec("ALTER TABLE requests ADD COLUMN status TEXT DEFAULT 'Needs Review'"); } catch {}

export default db;
