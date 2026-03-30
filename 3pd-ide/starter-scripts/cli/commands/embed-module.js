/**
 * 3pd embed module [--install]
 * File: commands/embed-module.js
 *
 * Generates a Drupal block module from the current embed app's embed.config.json.
 * Run from inside an embed app folder: cd apps/embed---<name> && 3pd embed module
 *
 * --install: copies to /web/modules/custom/, enables, clears cache (HUDX internal only)
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { log } from '../shared/log.js';

/**
 * @param {{ ideRoot: string, internal: boolean }} opts
 */
export default async function embedModule({ ideRoot, internal }) {
  log.header('HUDX Smart Embed Module Generator');

  if (!ideRoot) {
    log.error('Missing ideRoot. CLI did not pass correct options.');
    process.exit(1);
  }

  const cwd     = process.cwd();
  const appName = path.basename(cwd);

  // Validate we are inside an embed app folder
  const configPath = path.join(cwd, 'embed.config.json');
  if (!fs.existsSync(configPath)) {
    log.error('No embed.config.json found in the current directory.');
    log.dim(`Current directory: ${cwd}`);
    log.nl();
    log.info('Run this command from inside an embed app folder:');
    log.dim('  cd apps/embed---<name>');
    log.dim('  3pd embed module');
    log.nl();
    process.exit(1);
  }

  log.info(`App: ${appName}`);
  log.info(`Mode: ${internal ? 'Internal (HUDX)' : '3PD (third-party)'}`);
  log.dim(`Directory: ${cwd}`);
  log.nl();

  // Prefer a local create-module.js override, fall back to starter kit
  const localCreateModulePath   = path.join(cwd, 'create-module.js');
  const starterCreateModulePath = path.join(ideRoot, 'apps', '0.starter-smart-embed', 'create-module.js');
  const createModulePath = fs.existsSync(localCreateModulePath)
    ? localCreateModulePath
    : starterCreateModulePath;

  if (!fs.existsSync(createModulePath)) {
    log.error('create-module.js not found.');
    log.dim(`Expected at: ${starterCreateModulePath}`);
    log.nl();
    process.exit(1);
  }

  if (createModulePath === localCreateModulePath) {
    log.dim('Using local create-module.js override.');
  }

  const { default: createModule } = await import(pathToFileURL(createModulePath).href);

  try {
    await createModule(appName, { internal });
  } catch (err) {
    log.error('Module generation failed.');
    log.debug(err);
    process.exit(1);
  }

  log.header('Summary');

  if (internal) {
    log.success('Module generated and installed into Drupal.');
    log.dim('Next steps:');
    log.dim('  • Add the block in Layout Builder');
    log.dim(`  • Test at: /hudx-test/${appName}`);
  } else {
    log.success('Module generated (3PD mode).');
    log.dim('Next steps:');
    log.dim('  • Commit the generated module folder');
    log.dim('  • Push to your feature branch');
  }

  log.nl();
  log.success(`Module generation complete for "${appName}".`);
  log.nl();
}