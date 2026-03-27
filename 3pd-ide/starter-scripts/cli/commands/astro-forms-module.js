/**
 * 3pd astro-forms module
 * File: commands/astro-forms-module.js
 *
 * Generates a Drupal module from the current Astro Forms app.
 * The module contains only the static build (HTML/CSS/JS).
 * The Express server is NOT packaged — it deploys separately.
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { log } from '../shared/log.js';

export default async function astroFormsModule({ ideRoot, internal }) {
  log.header('HUDX Astro Forms Module Generator');

  if (!ideRoot) {
    log.error('Missing ideRoot. CLI did not pass correct options.');
    process.exit(1);
  }

  const cwd     = process.cwd();
  const appName = path.basename(cwd);
  const pkgPath = path.join(cwd, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    log.error('No package.json found in the current directory.');
    log.dim(`Current directory: ${cwd}`);
    log.nl();
    log.info('Run this command from inside an Astro Forms app folder:');
    log.dim('  cd apps/<your-app>');
    log.dim('  3pd astro-forms module');
    log.nl();
    process.exit(1);
  }

  log.info(`App:  ${appName}`);
  log.info(`Mode: ${internal ? 'Internal (HUDX)' : '3PD (third-party)'}`);
  log.dim(`Directory: ${cwd}`);
  log.nl();

  // Delegate to the shared create-module.js in the starter kit
  const createModulePath = path.join(
    ideRoot,
    'apps',
    '0.starter-astro-forms',
    'create-module.js'
  );

  if (!fs.existsSync(createModulePath)) {
    log.error('create-module.js not found.');
    log.dim(`Expected at: ${createModulePath}`);
    log.nl();
    process.exit(1);
  }

  log.header('Building Astro Forms App');

  const { default: createModule } = await import(pathToFileURL(createModulePath).href);

  try {
    await createModule(appName, { internal });

    log.header('Summary');
    log.success('Module generated and installed into Drupal.');
    log.dim('Next steps:');
    log.dim('  • Verify the module is enabled in Drupal');
    log.dim('  • Add the block in Layout Builder');
    log.dim('  • Deploy the Express server alongside Drupal');
    log.nl();
    log.success(`Module generation complete for "${appName}".`);
    log.nl();
  } catch (err) {
    log.error(`Module generation failed: ${err.message}`);
    process.exit(1);
  }
}
