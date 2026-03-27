/**
 * 3pd astro-forms app <name>
 * File: commands/astro-forms-app.js
 *
 * Copies /3pd-ide/apps/0.starter-astro-forms/starter-template → /3pd-ide/apps/astro-forms---<name>
 * then creates .env from .env.example and runs `npm install`.
 *
 * No Lando service. No separate DB setup — SQLite is created automatically
 * on first server startup.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { log } from '../shared/log.js';
import { FRAMEWORK_PREFIXES } from '../shared/frameworks.js';

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;

    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export default async function astroFormsApp(name, { ideRoot }) {
  log.header('Create New Astro Forms App');

  if (!ideRoot) {
    log.error('Missing ideRoot. CLI did not pass correct options.');
    process.exit(1);
  }

  const rawName = Array.isArray(name) ? name.join(' ') : name;
  const slug = rawName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');

  if (!slug) {
    log.error('Invalid app name.');
    process.exit(1);
  }

  const folderName  = FRAMEWORK_PREFIXES.astroForms + slug;
  const templateDir = path.join(ideRoot, 'apps', '0.starter-astro-forms', 'starter-template');
  const appDir      = path.join(ideRoot, 'apps', folderName);

  if (!fs.existsSync(templateDir)) {
    log.error('Astro Forms starter template not found.');
    log.dim(`Expected at: ${templateDir}`);
    process.exit(1);
  }

  if (fs.existsSync(appDir)) {
    log.error('App already exists.');
    log.dim(appDir);
    process.exit(1);
  }

  log.info(`App Name:    ${folderName}`);
  log.dim(`Template:    ${templateDir}`);
  log.dim(`Destination: ${appDir}`);
  log.nl();

  log.header('Copying Astro Forms Starter Template');
  copyRecursive(templateDir, appDir);
  log.success('Template copied.');

  log.header('Configuring Environment');
  const envExample = path.join(appDir, '.env.example');
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, path.join(appDir, '.env'));
    log.success('.env created from .env.example');
  }

  const pkgPath = path.join(appDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.name = folderName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    log.success(`package.json updated → "${folderName}"`);
  }

  log.header('Installing Dependencies');
  log.dim('Note: better-sqlite3 requires native compilation — this may take a moment.');
  try {
    execSync('npm install', { cwd: appDir, stdio: 'inherit' });
  } catch (err) {
    log.error('npm install failed.');
    log.debug(err);
    process.exit(1);
  }

  log.header('Summary');
  log.success(`Astro Forms app "${folderName}" created successfully.`);
  log.nl();
  log.dim('Next steps:');
  log.dim(`  cd apps/${folderName}`);
  log.dim('  npm run dev:server   # Terminal 1 — start Express API on localhost:3001');
  log.dim('  npm run dev          # Terminal 2 — start Astro dev server on localhost:4321');
  log.dim('  3pd astro-forms module   # when ready to generate the Drupal block module');
  log.nl();
}
