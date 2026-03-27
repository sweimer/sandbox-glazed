/**
 * 3pd astro app <name>
 * File: commands/astro-app.js
 *
 * Copies /3pd-ide/apps/0.starter-astro/starter-template → /3pd-ide/apps/astro---<name>
 * then creates .env from .env.example and runs `npm install`.
 *
 * No Lando service. No Express. No database setup.
 * Data comes from Drupal JSON:API at runtime.
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

function setupEnvFile(appDir) {
  const envExample = path.join(appDir, '.env.example');
  const envFile    = path.join(appDir, '.env');

  if (!fs.existsSync(envExample)) {
    log.warn('No .env.example found in starter template — skipping .env creation.');
    return;
  }

  let envContent = fs.readFileSync(envExample, 'utf8');

  // Auto-detect Drupal URL from lando (internal devs only — fails silently for 3PD)
  let drupalUrl = '';
  try {
    drupalUrl = execSync('lando ssh -c "cd /app && drush status --field=uri" 2>/dev/null', { encoding: 'utf8' }).trim();
  } catch {}

  if (drupalUrl) {
    envContent = envContent.replace(/PUBLIC_DRUPAL_BASE_URL=.*/, `PUBLIC_DRUPAL_BASE_URL=${drupalUrl}`);
    log.success(`.env created — Drupal URL auto-detected: ${drupalUrl}`);
  } else {
    log.success('.env created from .env.example');
    log.warn('Could not auto-detect Drupal URL. Update PUBLIC_DRUPAL_BASE_URL in .env manually.');
  }

  fs.writeFileSync(envFile, envContent);
}

export default async function astroApp(name, { ideRoot }) {
  log.header('Create New Astro App');

  if (!ideRoot) {
    log.error('Missing ideRoot. CLI did not pass correct options.');
    process.exit(1);
  }

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

  const folderName  = FRAMEWORK_PREFIXES.astro + slug;
  const templateDir = path.join(ideRoot, 'apps', '0.starter-astro', 'starter-template');
  const appDir      = path.join(ideRoot, 'apps', folderName);

  if (!fs.existsSync(templateDir)) {
    log.error('Astro starter template not found.');
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

  log.header('Copying Astro Starter Template');
  copyRecursive(templateDir, appDir);
  log.success('Template copied.');

  log.header('Configuring Environment');
  setupEnvFile(appDir);

  const pkgPath = path.join(appDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.name = folderName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    log.success(`package.json updated → "${folderName}"`);
  }

  log.header('Installing Dependencies');
  try {
    execSync('npm install', { cwd: appDir, stdio: 'inherit' });
  } catch (err) {
    log.error('npm install failed.');
    log.debug(err);
    process.exit(1);
  }

  log.header('Summary');
  log.success(`Astro app "${folderName}" created successfully.`);
  log.nl();
  log.dim('Next steps:');
  log.dim(`  cd apps/${folderName}`);
  log.dim('  Edit src/pages/index.astro — replace YOUR_CONTENT_TYPE with your Drupal content type');
  log.dim('  npm run dev        # starts Astro dev server on localhost:4321');
  log.dim('  3pd astro module   # when ready to generate a Drupal block module');
  log.nl();
}
