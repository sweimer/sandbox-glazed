/**
 * drupalDevAssets.js
 *
 * Shared helper: builds drupal-dev-styles.css and drupal-dev-scripts.js content.
 *
 * Used by:
 *   styles-sync.js    — writes to ALL apps (monorepo internal workflow)
 *   styles-refresh.js — writes to CURRENT app only (3PD dev workflow)
 *
 * Two modes (auto-detected):
 *   Monorepo: reads compiled CSS/JS from web/themes/ directly — fast, offline.
 *   Standalone: reads DRUPAL_BASE_URL from an app .env, fetches + downloads.
 *
 * Returns: { cssContent: string|null, jsContent: string|null }
 */

import fs from 'fs';
import path from 'path';
import { log } from './log.js';

/** Minimal .env parser (no dotenv dependency needed). */
export function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const result = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = val;
  }
  return result;
}

// CSS files to concatenate (relative to Drupal root), in load order.
const MONOREPO_CSS_FILES = [
  'web/themes/contrib/bootstrap5/dist/bootstrap/5.3.8/dist/css/bootstrap.min.css',
  'web/themes/contrib/dxpr_theme/css/base/variables.css',
  'web/themes/contrib/dxpr_theme/css/vendor-extensions/bootstrap-5.css',
  'web/themes/contrib/dxpr_theme/css/vendor-extensions/bootstrap-theme.css',
  'web/themes/contrib/dxpr_theme/css/base/layout.css',
  'web/themes/contrib/dxpr_theme/css/base/typography.css',
  'web/themes/contrib/dxpr_theme/css/base/forms.css',
  'web/themes/contrib/dxpr_theme/css/helpers/helper-classes.css',
  'web/themes/contrib/dxpr_theme/css/animations-dxpr.css',
];

// JS files to concatenate (relative to Drupal root).
// Only Bootstrap bundle is included — DXPR theme scripts require Drupal.behaviors
// and drupalSettings globals that don't exist in standalone dev mode.
const MONOREPO_JS_FILES = [
  'web/themes/contrib/bootstrap5/dist/bootstrap/5.3.8/dist/js/bootstrap.bundle.min.js',
];

/**
 * Build CSS and JS content for Drupal dev assets.
 *
 * @param {{ drupalRoot: string, cwd: string }} opts
 *   drupalRoot — path to Drupal repo root (for monorepo mode)
 *   cwd        — path to the current app (for standalone .env lookup)
 * @returns {Promise<{ cssContent: string|null, jsContent: string|null }>}
 */
export async function buildDrupalDevAssets({ drupalRoot, cwd }) {
  const themeCheckPath = path.join(drupalRoot, 'web/themes/contrib/dxpr_theme');
  const isMonorepo = fs.existsSync(themeCheckPath);

  if (isMonorepo) {
    log.info('Monorepo detected — building from local theme files...');
    const cssContent = buildFromLocalFiles(drupalRoot, MONOREPO_CSS_FILES, 'CSS', 'drupal-dev-styles.css');
    const jsContent  = buildFromLocalFiles(drupalRoot, MONOREPO_JS_FILES,  'JS',  'drupal-dev-scripts.js');
    return { cssContent, jsContent };
  } else {
    return await fetchFromDrupal(cwd);
  }
}

// ----------------------------------------------------------------
// Monorepo: concatenate files from local theme directories
// ----------------------------------------------------------------
function buildFromLocalFiles(drupalRoot, files, label, outName) {
  if (!files.length) return null;

  const isJs   = outName.endsWith('.js');
  const cOpen  = isJs ? '//' : '/*';
  const cClose = isJs ? ''   : ' */';

  const ts = new Date().toISOString();
  const header = [
    `${cOpen} ============================================================ ${cClose}`,
    `${cOpen} HUDX Drupal Dev ${label.padEnd(40)} ${cClose}`,
    `${cOpen} Generated: ${ts.padEnd(43)} ${cClose}`,
    `${cOpen} Run \`3pd styles sync\` to refresh after theme changes.     ${cClose}`,
    `${cOpen} This file is gitignored — do not commit.                   ${cClose}`,
    `${cOpen} ============================================================ ${cClose}`,
    '',
  ].join('\n');

  let combined = header;
  let missing = 0;

  for (const rel of files) {
    const fullPath = path.join(drupalRoot, rel);
    if (!fs.existsSync(fullPath)) {
      log.warn(`  Not found: ${rel}`);
      missing++;
      continue;
    }
    const sep = isJs ? `// === ${path.basename(rel)} ===` : `/* === ${path.basename(rel)} === */`;
    combined += `\n${sep}\n`;
    combined += fs.readFileSync(fullPath, 'utf8');
    combined += '\n';
  }

  if (missing === files.length) {
    log.error(`No ${label} files were found. Check your Drupal theme paths.`);
    return null;
  }

  if (missing > 0) log.warn(`  ${missing} ${label} file(s) were skipped (not found).`);
  log.info(`  Concatenated ${files.length - missing} ${label} file(s).`);
  return combined;
}

// ----------------------------------------------------------------
// Standalone: fetch assets from Drupal URL in the app's .env
// ----------------------------------------------------------------
async function fetchFromDrupal(cwd) {
  log.info('Standalone mode — fetching assets from Drupal...');

  // Try the current app's .env first, then scan sibling apps
  let drupalBase = null;

  const candidates = [];
  const appEnv = path.join(cwd, '.env');
  if (fs.existsSync(appEnv)) candidates.push(appEnv);

  // Also scan sibling app directories (for styles-sync use case)
  const appsDir = path.resolve(cwd, '..');
  if (fs.existsSync(appsDir)) {
    try {
      const siblings = fs.readdirSync(appsDir)
        .filter(n => !n.startsWith('0.starter-') && !n.startsWith('.'))
        .map(n => path.join(appsDir, n, '.env'))
        .filter(p => p !== appEnv);
      candidates.push(...siblings);
    } catch {}
  }

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const env = parseEnvFile(envPath);
    const url = env.PUBLIC_DRUPAL_BASE_URL || env.VITE_DRUPAL_BASE_URL;
    if (url && url.startsWith('http')) {
      drupalBase = url.replace(/\/$/, '');
      break;
    }
  }

  if (!drupalBase) {
    log.error(
      'Could not find a Drupal URL.\n' +
      'Set PUBLIC_DRUPAL_BASE_URL or VITE_DRUPAL_BASE_URL in your app .env and re-run.'
    );
    return { cssContent: null, jsContent: null };
  }

  log.info(`  Fetching from: ${drupalBase}`);

  try {
    const res = await fetch(drupalBase + '/', {
      headers: { 'User-Agent': '3pd-styles-sync/1.0' }
    });

    if (!res.ok) {
      log.error(`Drupal returned ${res.status} ${res.statusText}`);
      return { cssContent: null, jsContent: null };
    }

    const html = await res.text();

    const cssUrls = [...html.matchAll(
      /<link[^>]+rel="stylesheet"[^>]+href="([^"]*\/sites\/default\/files\/css\/[^"]*)"[^>]*>/g
    )].map(m => m[1]);

    const jsUrls = [...html.matchAll(
      /<script[^>]+src="([^"]*\/sites\/default\/files\/js\/[^"]*)"[^>]*>/g
    )].map(m => m[1]);

    const ts = new Date().toISOString();
    const cssContent = await downloadAndConcat(cssUrls, drupalBase, 'CSS', ts);
    const jsContent  = await downloadAndConcat(jsUrls,  drupalBase, 'JS',  ts);

    return { cssContent, jsContent };

  } catch (err) {
    log.error(`Failed to fetch from ${drupalBase}: ${err.message}`);
    return { cssContent: null, jsContent: null };
  }
}

async function downloadAndConcat(urls, drupalBase, label, ts) {
  if (!urls.length) {
    log.warn(`  No ${label} aggregation URLs found in Drupal page.`);
    return null;
  }

  log.info(`  Found ${urls.length} ${label} file(s). Downloading...`);
  const isJs = label === 'JS';
  const header = [
    `${isJs ? '//' : '/*'} HUDX Drupal Dev ${label} | Generated: ${ts} | Source: ${drupalBase} ${isJs ? '' : '*/'}`,
    '',
  ].join('\n');

  let combined = header;
  for (const url of urls) {
    const fullUrl = url.startsWith('http') ? url : `${drupalBase}${url}`;
    const r = await fetch(fullUrl);
    if (!r.ok) { log.warn(`  Skipped (${r.status}): ${url}`); continue; }
    const name = fullUrl.split('/').pop().split('?')[0];
    combined += `\n${isJs ? '//' : '/*'} === ${name} ${isJs ? '' : '=== */'}\n`;
    combined += await r.text();
    combined += '\n';
  }
  return combined;
}
