/**
 * 3pd react module
 * File: commands/react-module.js
 *
 * Generates a Drupal module from the current React app.
 * Supports:
 *   - 3PD mode (default)
 *   - Internal HUDX mode (--install)
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { log } from '../shared/log.js';

/**
 * @param {{ ideRoot: string, internal: boolean }} opts
 */
export default async function reactModule({ ideRoot, internal }) {
  log.header("HUDX React Module Generator");

  if (!ideRoot) {
    log.error("Missing ideRoot. CLI did not pass correct options.");
    process.exit(1);
  }

  const cwd     = process.cwd();
  const appName = path.basename(cwd);
  const pkgPath = path.join(cwd, 'package.json');

  // Validate we are inside an app folder
  if (!fs.existsSync(pkgPath)) {
    log.error("No package.json found in the current directory.");
    log.dim(`Current directory: ${cwd}`);
    log.nl();
    log.info("Run this command from inside a React app folder:");
    log.dim("  cd apps/<your-app>");
    log.dim("  3pd react module");
    log.nl();
    process.exit(1);
  }

  // Display mode + paths
  log.info(`App: ${appName}`);
  log.info(`Mode: ${internal ? "Internal (HUDX)" : "3PD (third-party)"}`);
  log.dim(`Directory: ${cwd}`);
  log.nl();

  const createModulePath = path.join(
    ideRoot,
    'apps',
    '0.starter-react',
    'create-module.js'
  );

  if (!fs.existsSync(createModulePath)) {
    log.error("create-module.js not found.");
    log.dim(`Expected at: ${createModulePath}`);
    log.nl();
    process.exit(1);
  }

  log.header("Building React App");

  // Dynamic import (ESM-safe)
  const { default: createModule } = await import(pathToFileURL(createModulePath).href);

  try {
    await createModule(appName, { internal });
  } catch (err) {
    log.error("Module generation failed.");
    log.debug(err);
    process.exit(1);
  }

  log.header("Summary");

  if (internal) {
    log.success("Module generated and installed into Drupal.");
    log.dim("Next steps:");
    log.dim("  • Verify the module is enabled in Drupal");
    log.dim("  • Add the block in Layout Builder");
  } else {
    log.success("Module generated (3PD mode).");
    log.dim("Next steps:");
    log.dim("  • Commit the generated module folder");
    log.dim("  • Push to your feature branch");
  }

  log.nl();
  log.success(`Module generation complete for "${appName}".`);
  log.nl();
}
