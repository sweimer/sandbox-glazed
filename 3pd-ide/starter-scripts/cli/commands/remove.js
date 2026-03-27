/**
 * 3pd remove <module-name>
 *
 * Uninstalls a Drupal module and removes it from /web/modules/custom/.
 * Optionally deletes the app source from /3pd-ide/apps/.
 *
 * Usage:
 *   3pd remove hudx_astro_forms___poc_02
 *   3pd remove hudx_astro_forms___poc_02 --delete-app
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { log } from '../shared/log.js';

function tryExec(commands) {
  for (const cmd of commands) {
    try {
      execSync(cmd, { stdio: 'inherit' });
      return true;
    } catch {}
  }
  return false;
}

export default async function remove(moduleName, { ideRoot, deleteApp }) {
  log.header(`Remove Module: ${moduleName}`);

  const drupalModuleDir = path.join(ideRoot, '..', 'web', 'modules', 'custom', moduleName);

  if (!fs.existsSync(drupalModuleDir)) {
    log.warn(`Module not found in /web/modules/custom/: ${moduleName}`);
    log.warn('Nothing to remove.');
    return;
  }

  // Uninstall from Drupal
  log.info('Uninstalling from Drupal...');
  const uninstalled = tryExec([
    `lando ssh -c "cd /app && drush pm:uninstall ${moduleName} -y"`,
    `lando ssh -c "cd /app && drush php:eval \\"\\\\Drupal::service('module_installer')->uninstall(['${moduleName}'], false);\\""`
  ]);

  if (!uninstalled) {
    log.warn('Could not uninstall via drush — removing files anyway.');
    log.dim(`Manual fallback: lando ssh -c "cd /app && drush pm:uninstall ${moduleName} -y"`);
  }

  // Delete module from /web/modules/custom/
  fs.rmSync(drupalModuleDir, { recursive: true, force: true });
  log.success(`Deleted: ${drupalModuleDir}`);

  // Clear caches
  log.info('Clearing caches...');
  tryExec(['lando crx']);

  // Optionally delete app source
  if (deleteApp) {
    // Derive app folder name from module machine name
    // hudx_astro_forms___poc_02 → astro-forms---poc-02
    const appSlug = moduleName
      .replace(/^hudx_/, '')
      .replace(/___/g, '---')
      .replace(/_/g, '-');

    // Try common prefixes
    const appsDir  = path.join(ideRoot, 'apps');
    const candidates = [
      appSlug,
      `astro---${appSlug.replace(/^astro---/, '')}`,
      `astro-forms---${appSlug.replace(/^astro-forms---/, '')}`,
      `react---${appSlug.replace(/^react---/, '')}`,
    ];

    let deleted = false;
    for (const candidate of candidates) {
      const appDir = path.join(appsDir, candidate);
      if (fs.existsSync(appDir)) {
        fs.rmSync(appDir, { recursive: true, force: true });
        log.success(`Deleted app: ${appDir}`);
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      log.warn(`App folder not found for: ${appSlug}`);
      log.dim('Delete it manually if needed.');
    }
  }

  log.nl();
  log.success(`${moduleName} removed.`);
  log.nl();
}
