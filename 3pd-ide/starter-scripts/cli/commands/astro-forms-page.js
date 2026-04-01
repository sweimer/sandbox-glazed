/**
 * 3pd astro-forms page
 * File: commands/astro-forms-page.js
 *
 * Generates a full-page Drupal module from the current Astro Forms app.
 * Unlike the block generator, this creates a real Drupal route that owns
 * an entire page — no Block plugin, no Layout Builder placement needed.
 *
 * The Astro app code is identical to the block version. Only the module
 * generator output differs:
 *   - A real page route (/<appName>)
 *   - A page-level twig template that strips all Drupal regions
 *   - No Plugin/Block/ class
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { log } from '../shared/log.js';

export default async function astroFormsPage({ ideRoot, internal }) {
  log.header('HUDX Astro Forms Page Generator');

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
    log.dim('  3pd astro-forms page');
    log.nl();
    process.exit(1);
  }

  log.info(`App:  ${appName}`);
  log.info(`Mode: ${internal ? 'Internal (HUDX)' : '3PD (third-party)'}`);
  log.dim(`Directory: ${cwd}`);
  log.nl();

  // Check for a local create-page.js in the app directory first (override).
  // This lets individual apps customize their Drupal page generation without
  // modifying the shared starter kit.
  const localCreatePagePath   = path.join(cwd, 'create-page.js');
  const starterCreatePagePath = path.join(ideRoot, 'apps', '0.starter-astro-forms', 'create-page.js');
  const createPagePath = fs.existsSync(localCreatePagePath)
    ? localCreatePagePath
    : starterCreatePagePath;

  if (fs.existsSync(localCreatePagePath)) {
    log.info('Using local create-page.js override.');
  }

  if (!fs.existsSync(createPagePath)) {
    log.error('create-page.js not found.');
    log.dim(`Expected at: ${createPagePath}`);
    log.nl();
    process.exit(1);
  }

  log.header('Building Astro Forms App');

  const { default: createPage } = await import(pathToFileURL(createPagePath).href);

  try {
    await createPage(appName, { internal });

    log.header('Summary');
    log.success('Page module generated.');
    log.dim('Next steps:');
    log.dim('  • Enable the module in Drupal (drush en <module>)');
    log.dim('  • Visit /<app-name> to see your app');
    log.dim('  • Deploy the Express server alongside Drupal');
    log.nl();
    log.success(`Page generation complete for "${appName}".`);
    log.nl();
  } catch (err) {
    log.error(`Page generation failed: ${err.message}`);
    process.exit(1);
  }
}
