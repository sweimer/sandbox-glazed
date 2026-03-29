/**
 * 3pd db pull
 * File: commands/db-pull.js
 *
 * Pulls the full Pantheon database into the local Lando instance.
 * HUDX internal use only — requires terminus + a running Lando environment.
 *
 * Run from anywhere inside the SANDBOX-glazed project:
 *   3pd db pull
 *
 * What it does:
 *   1. Creates a fresh DB backup on Pantheon (terminus backup:create)
 *   2. Downloads it to /tmp/pantheon-db.sql.gz (terminus backup:get)
 *   3. Imports it into the local Lando DB (lando db-import)
 *   4. Clears + rebuilds Drupal cache (lando crx)
 *
 * Prerequisites:
 *   - terminus authenticated: terminus auth:login
 *   - SSH key added:          ssh-add ~/.ssh/pantheon_local
 *   - Lando running:          lando start
 */

import fs from 'fs';
import path from 'path';
import { log } from '../shared/log.js';
import { run } from '../shared/exec.js';

export default async function dbPull({ ideRoot }) {
  log.header('3PD DB Pull — Pantheon → Lando');

  const drupalRoot = path.resolve(ideRoot, '..');

  // -------------------------------------------------------------------------
  // Assert this is a Lando project
  // -------------------------------------------------------------------------
  if (!fs.existsSync(path.join(drupalRoot, '.lando.yml'))) {
    log.error('.lando.yml not found. Run this from inside the SANDBOX-glazed project.');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Check terminus is available
  // -------------------------------------------------------------------------
  try {
    const { execSync } = await import('child_process');
    execSync('which terminus', { stdio: 'pipe' });
  } catch {
    log.error('terminus not found.');
    log.dim('Install: composer global require pantheon-systems/terminus');
    log.dim('Then:    terminus auth:login');
    process.exit(1);
  }

  // -------------------------------------------------------------------------
  // Get site name — 3pd.config.json or default
  // -------------------------------------------------------------------------
  const configPath = path.join(drupalRoot, '3pd.config.json');
  let siteName = '3-pd-ide';
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (config.pantheonSite) siteName = config.pantheonSite;
  }
  const siteEnv = `${siteName}.dev`;

  log.info(`Site:  ${siteEnv}`);
  log.nl();

  // Must be inside the project dir — lando db-import runs inside the container
  // which only has access to the mounted project directory, not macOS /tmp.
  const tmpDir  = path.join(drupalRoot, 'tmp');
  const tmpFile = path.join(tmpDir, 'pantheon-db.sql.gz');
  // Clean up any leftover file from a previous failed run — terminus refuses to overwrite.
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  fs.mkdirSync(tmpDir, { recursive: true });

  // -------------------------------------------------------------------------
  // Step 1 — Create fresh backup on Pantheon
  // -------------------------------------------------------------------------
  log.info('Creating Pantheon DB backup (this may take a moment)...');
  run(`terminus backup:create ${siteEnv} --element=db`);

  // -------------------------------------------------------------------------
  // Step 2 — Download backup
  // -------------------------------------------------------------------------
  log.info(`Downloading to ${tmpFile}...`);
  run(`terminus backup:get ${siteEnv} --element=db --to=${tmpFile}`);

  // -------------------------------------------------------------------------
  // Step 3 — Import into Lando
  // -------------------------------------------------------------------------
  log.info('Importing into Lando (replacing local DB)...');
  run(`lando db-import tmp/pantheon-db.sql.gz`, { cwd: drupalRoot });

  // -------------------------------------------------------------------------
  // Step 4 — Clean up download
  // -------------------------------------------------------------------------
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

  // -------------------------------------------------------------------------
  // Step 5 — Cache reset
  // -------------------------------------------------------------------------
  log.info('Clearing Drupal cache...');
  run('lando crx', { cwd: drupalRoot });

  log.nl();
  log.success('DB pull complete. Lando is now running Pantheon data.');
  log.nl();
}
