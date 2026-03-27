/**
 * 3pd list
 * Lists all apps and installed Drupal modules with their test routes.
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { log } from '../shared/log.js';

// OSC 8 clickable hyperlink (works in iTerm2, VS Code terminal, most modern terminals)
function link(url, text) {
  return `\u001b]8;;${url}\u001b\\${text}\u001b]8;;\u001b\\`;
}

function getTestUrl(moduleName, routingYmlPath) {
  if (!fs.existsSync(routingYmlPath)) return null;
  const content = fs.readFileSync(routingYmlPath, 'utf8');
  const match   = content.match(/path:\s*['"]?([^'"\n]+)/);
  return match ? match[1].trim() : null;
}

export default async function list({ ideRoot }) {
  const appsDir        = path.join(ideRoot, 'apps');
  const drupalRoot     = path.join(ideRoot, '..', 'web', 'modules', 'custom');
  const siteBase       = 'https://sandbox-glazed.lndo.site';

  // ── Apps ──────────────────────────────────────────────────────────
  log.header('Apps');

  const starters = new Set(['0.starter-astro', '0.starter-astro-forms', '0.starter-react']);

  const apps = fs.existsSync(appsDir)
    ? fs.readdirSync(appsDir, { withFileTypes: true })
        .filter(e => e.isDirectory() && !starters.has(e.name))
        .map(e => e.name)
        .filter(n => !n.startsWith('.'))
    : [];

  if (apps.length === 0) {
    log.warn('No apps yet.');
  } else {
    for (const name of apps) {
      const hasPkg = fs.existsSync(path.join(appsDir, name, 'package.json'));
      console.log(`  ${chalk.cyan(name)}${hasPkg ? '' : chalk.gray(' (no package.json)')}`);
    }
  }

  // ── Installed Drupal modules + test routes ─────────────────────────
  log.nl();
  log.header('Installed Modules + Test Routes');

  if (!fs.existsSync(drupalRoot)) {
    log.warn('No Drupal custom modules directory found (internal mode only).');
    return;
  }

  const modules = fs.readdirSync(drupalRoot, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  if (modules.length === 0) {
    log.warn('No modules installed.');
  } else {
    for (const name of modules) {
      const routingYml = path.join(drupalRoot, name, `${name}.routing.yml`);
      const routePath  = getTestUrl(name, routingYml);
      const fullUrl    = routePath ? `${siteBase}${routePath}` : null;

      if (fullUrl) {
        console.log(`  ${chalk.green(name)}`);
        console.log(`    ${link(fullUrl, chalk.underline(fullUrl))}`);
      } else {
        console.log(`  ${chalk.yellow(name)}  ${chalk.gray('(no test route)')}`);
      }
    }
  }

  log.nl();
}
