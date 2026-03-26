/**
 * 3pd list
 * File: commands/list.js
 *
 * Lists all apps in /3pd-ide/apps
 * Lists all Drupal modules in /3pd-ide/web/modules/custom
 */

import fs from 'fs';
import path from 'path';
import { log } from '../shared/log.js';

/**
 * @param {{ ideRoot: string }} opts
 */
export default async function list({ ideRoot }) {
  log.header("3PD IDE Inventory");

  //
  // ────────────────────────────────────────────────────────────────
  // Apps
  // ────────────────────────────────────────────────────────────────
  //
  const appsDir = path.join(ideRoot, 'apps');
  log.info("Apps");
  log.dim(`Location: ${appsDir}`);
  log.nl();

  if (!fs.existsSync(appsDir)) {
    log.warn("(directory not found)");
  } else {
    const apps = fs.readdirSync(appsDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);

    if (apps.length === 0) {
      log.warn("(no apps yet — run `3pd react app <name>` to create one)");
    } else {
      apps.forEach(name => {
        const hasPkg = fs.existsSync(path.join(appsDir, name, 'package.json'));
        if (hasPkg) {
          log.success(`• ${name}`);
        } else {
          log.warn(`• ${name}  (no package.json)`);
        }
      });
    }
  }

  log.nl(2);

  //
  // ────────────────────────────────────────────────────────────────
  // Drupal Modules (web/modules/custom)
  // ────────────────────────────────────────────────────────────────
  //
  const drupalModulesDir = path.join(ideRoot, '..', 'web', 'modules', 'custom');
  log.info("Drupal Modules");
  log.dim(`Location: ${drupalModulesDir}`);
  log.nl();

  // Auto-create Drupal custom modules directory if missing
  if (!fs.existsSync(drupalModulesDir)) {
    fs.mkdirSync(drupalModulesDir, { recursive: true });
    log.dim("(created empty Drupal custom modules directory)");
  }

  const modules = fs.readdirSync(drupalModulesDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  if (modules.length === 0) {
    log.warn("(no modules yet — run `3pd react module` inside an app)");
  } else {
    modules.forEach(name => log.success(`• ${name}`));
  }

  log.nl();
  log.success("Inventory complete.");
  log.nl();
}
