/**
 * 3pd embed create <name> [--url <url>]
 * File: commands/embed-create.js
 *
 * Creates a new smart embed app folder:
 *   3pd-ide/apps/embed---<name>/
 *     embed.config.json     ← configure embedUrl, title, fallbackHeight
 *     snippet/
 *       hudx-resize.js      ← child-side snippet, share with the embedded app owner
 *
 * No npm install. No build step. Just configure and run 3pd embed module --install.
 */

import fs from 'fs';
import path from 'path';
import { log } from '../shared/log.js';
import { FRAMEWORK_PREFIXES } from '../shared/frameworks.js';

export default function embedCreate(name, { ideRoot, url }) {
  log.header('Create Smart Embed App');

  const rawName = Array.isArray(name) ? name.join(' ') : name;
  const slug = rawName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');

  if (!slug) {
    log.error('Invalid app name.');
    process.exit(1);
  }

  const folderName = FRAMEWORK_PREFIXES.embed + slug;
  const appDir     = path.join(ideRoot, 'apps', folderName);

  if (fs.existsSync(appDir)) {
    log.error('App already exists.');
    log.dim(appDir);
    process.exit(1);
  }

  fs.mkdirSync(appDir, { recursive: true });

  // Write embed.config.json
  const title = slug
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

  const config = {
    embedUrl:      url || 'YOUR_EMBED_URL',
    title,
    fallbackHeight: 600,
  };

  fs.writeFileSync(
    path.join(appDir, 'embed.config.json'),
    JSON.stringify(config, null, 2) + '\n'
  );

  // Copy snippet from starter
  const snippetSrc = path.join(
    ideRoot, 'apps', '0.starter-smart-embed', 'snippet', 'hudx-resize.js'
  );
  const snippetDir = path.join(appDir, 'snippet');
  fs.mkdirSync(snippetDir, { recursive: true });

  if (fs.existsSync(snippetSrc)) {
    fs.copyFileSync(snippetSrc, path.join(snippetDir, 'hudx-resize.js'));
    log.success('Snippet copied → snippet/hudx-resize.js');
  } else {
    log.warn('Could not find hudx-resize.js in starter. Snippet not copied.');
  }

  log.success(`Smart embed app "${folderName}" created.`);
  log.nl();

  if (!url || url === 'YOUR_EMBED_URL') {
    log.warn('embedUrl is not set. Edit embed.config.json before generating the module:');
    log.dim(`  ${appDir}/embed.config.json`);
  } else {
    log.success(`Embed URL: ${url}`);
  }

  log.nl();
  log.dim('Next steps:');
  log.dim(`  cd apps/${folderName}`);
  if (!url) log.dim('  # Edit embed.config.json → set embedUrl');
  log.dim('  3pd embed module --install');
  log.nl();
  log.info('Child-side snippet: snippet/hudx-resize.js');
  log.dim('  Share this file with the embedded app owner.');
  log.dim('  They add <script src="hudx-resize.js"></script> to every page');
  log.dim('  to enable auto-resize. window.hudxSendHeight() for manual calls.');
  log.nl();
}