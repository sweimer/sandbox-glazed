/**
 * 3pd styles sync
 *
 * Generates public/drupal-dev-styles.css AND public/drupal-dev-scripts.js in
 * every app (and starter templates) so local dev servers render and behave with
 * the same Bootstrap + DXPR theme assets as Drupal.
 *
 * Two modes (auto-detected):
 *   Monorepo (SANDBOX-glazed): reads compiled files directly from the local
 *     web/themes/ directories — fast, offline, always current.
 *
 *   Standalone (3PD dev repo): reads DRUPAL_BASE_URL from an app's .env, fetches
 *     the Drupal homepage to discover current CSS/JS URLs, downloads and concatenates.
 *
 * Generated files are gitignored. Re-run after theme changes or lando crx.
 *
 * NOTE on JS: DXPR theme scripts that depend on Drupal.behaviors / drupalSettings
 * are excluded — they would throw in a standalone dev environment. Only Bootstrap
 * bundle JS is included (dropdowns, collapse, modals, tooltips).
 */

import fs from 'fs';
import path from 'path';
import { log } from '../shared/log.js';
import { buildDrupalDevAssets } from '../shared/drupalDevAssets.js';

export default async function stylesSync({ ideRoot }) {
  const drupalRoot = path.resolve(ideRoot, '..');
  const appsDir    = path.join(ideRoot, 'apps');

  log.header('Syncing Drupal Dev Assets');

  // Use any active app's cwd as the reference point for standalone .env scanning
  const { cssContent, jsContent } = await buildDrupalDevAssets({ drupalRoot, cwd: appsDir });

  if (!cssContent && !jsContent) {
    log.error('Could not generate dev assets. See warnings above.');
    return;
  }

  // ----------------------------------------------------------------
  // Write to all active apps and starter templates
  // ----------------------------------------------------------------
  const targets = [];
  const entries = fs.readdirSync(appsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('0.starter-')) {
      targets.push(path.join(appsDir, entry.name, 'starter-template', 'public'));
    } else {
      targets.push(path.join(appsDir, entry.name, 'public'));
    }
  }

  let written = 0;
  for (const publicDir of targets) {
    fs.mkdirSync(publicDir, { recursive: true });
    if (cssContent) fs.writeFileSync(path.join(publicDir, 'drupal-dev-styles.css'), cssContent, 'utf8');
    if (jsContent)  fs.writeFileSync(path.join(publicDir, 'drupal-dev-scripts.js'),  jsContent,  'utf8');
    written++;
  }

  const assets = [cssContent && 'drupal-dev-styles.css', jsContent && 'drupal-dev-scripts.js']
    .filter(Boolean).join(' + ');
  log.success(`${assets} written to ${written} locations.`);
  log.info('Restart your dev server to pick up the new assets.');
}
