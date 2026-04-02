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
import stylesSync from './styles-sync.js';

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

  // Load 3pd.config.json at repo root
  let drupalUrl = '';
  let defaultContentType = '';
  let assetsUrl = '';
  let themeSystem = '';
  const configPath = path.join(ideRoot, '..', '3pd.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.pantheonUrl)        drupalUrl          = config.pantheonUrl;
      if (config.defaultContentType) defaultContentType = config.defaultContentType;
      if (config.assetsUrl)          assetsUrl          = config.assetsUrl;
      if (config.themeSystem)        themeSystem        = config.themeSystem;
    } catch {}
  }

  // Fall back to Lando detection
  if (!drupalUrl) {
    try {
      drupalUrl = execSync('lando ssh -c "cd /app && drush status --field=uri" 2>/dev/null', { encoding: 'utf8' }).trim();
    } catch {}
  }

  const envExample = path.join(appDir, '.env.example');
  if (fs.existsSync(envExample)) {
    let envContent = fs.readFileSync(envExample, 'utf8');
    if (drupalUrl) {
      envContent = envContent.replace(/PUBLIC_DRUPAL_BASE_URL=.*/, `PUBLIC_DRUPAL_BASE_URL=${drupalUrl}`);
      log.success(`.env created — Drupal URL: ${drupalUrl}`);
    } else {
      log.success('.env created from .env.example');
      log.warn('Could not resolve Drupal URL. Update PUBLIC_DRUPAL_BASE_URL in .env manually.');
    }
    envContent = envContent
      .replace('APP_SLUG=YOUR_APP_SLUG', `APP_SLUG=${folderName}`)
      .replace('PUBLIC_APP_SLUG=YOUR_APP_SLUG', `PUBLIC_APP_SLUG=${folderName}`);
    if (assetsUrl) {
      envContent = envContent.replace('PUBLIC_ASSETS_URL=', `PUBLIC_ASSETS_URL=${assetsUrl}`);
      log.success(`PUBLIC_ASSETS_URL set to: ${assetsUrl}`);
    }
    fs.writeFileSync(path.join(appDir, '.env'), envContent);
    log.success(`APP_SLUG set to: ${folderName}`);
  }

  // Replace YOUR_CONTENT_TYPE placeholder in index.astro
  if (defaultContentType) {
    const indexPath = path.join(appDir, 'src', 'pages', 'index.astro');
    if (fs.existsSync(indexPath)) {
      const updated = fs.readFileSync(indexPath, 'utf8').replace(/YOUR_CONTENT_TYPE/g, defaultContentType);
      fs.writeFileSync(indexPath, updated);
      log.success(`index.astro — content type set to: ${defaultContentType}`);
    }
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

  log.header('Syncing Drupal Dev Assets');
  if (assetsUrl) {
    log.info(`Using remote theme assets from: ${assetsUrl}`);
    log.dim('Skipping local drupal-dev-styles.css generation — PUBLIC_ASSETS_URL is set.');
    log.dim('Layout.astro will load styles from assetsUrl in dev mode.');
  } else {
    await stylesSync({ ideRoot });
  }

  log.header('Summary');
  log.success(`Astro Forms app "${folderName}" created successfully.`);
  log.nl();
  log.dim('Next steps:');
  log.dim(`  cd apps/${folderName}`);
  log.dim('  Edit src/pages/index.astro — replace YOUR_CONTENT_TYPE with your Drupal content type');
  log.dim('  npm run dev          # starts Astro + Express together on localhost:4321');
  log.dim('  3pd astro-forms module   # when ready to generate the Drupal block module');
  log.nl();
}
