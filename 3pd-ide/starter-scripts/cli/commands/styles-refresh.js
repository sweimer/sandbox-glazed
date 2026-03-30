/**
 * 3pd styles refresh
 *
 * Refreshes drupal-dev-styles.css and drupal-dev-scripts.js for the CURRENT app only.
 * Run from inside your app directory: cd apps/my-app && 3pd styles refresh
 *
 * Two modes (auto-detected):
 *   Monorepo: reads compiled CSS/JS from local web/themes/ — fast, offline.
 *   Standalone (3PD dev): reads PUBLIC_DRUPAL_BASE_URL or VITE_DRUPAL_BASE_URL from
 *     the app's .env, fetches Drupal to discover current CSS/JS, downloads and writes.
 *
 * Use this when the Drupal theme changes and you need your local dev styles to match.
 * After running, restart your dev server.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { log } from '../shared/log.js';
import { buildDrupalDevAssets } from '../shared/drupalDevAssets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export default async function stylesRefresh({ ideRoot }) {
  const cwd        = process.cwd();
  const drupalRoot = path.resolve(ideRoot, '..');

  log.header('Refreshing Drupal Dev Assets');
  log.dim(`App: ${cwd}`);

  const { cssContent, jsContent } = await buildDrupalDevAssets({ drupalRoot, cwd });

  if (!cssContent && !jsContent) {
    log.error('Could not generate dev assets. See warnings above.');
    return;
  }

  const publicDir = path.join(cwd, 'public');
  fs.mkdirSync(publicDir, { recursive: true });

  if (cssContent) fs.writeFileSync(path.join(publicDir, 'drupal-dev-styles.css'), cssContent, 'utf8');
  if (jsContent)  fs.writeFileSync(path.join(publicDir, 'drupal-dev-scripts.js'),  jsContent,  'utf8');

  const assets = [cssContent && 'drupal-dev-styles.css', jsContent && 'drupal-dev-scripts.js']
    .filter(Boolean).join(' + ');
  log.success(`${assets} refreshed.`);
  log.info('Restart your dev server to pick up the changes.');
}
