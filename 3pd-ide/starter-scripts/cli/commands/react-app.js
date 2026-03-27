/**
 * 3pd react app <name>
 * File: commands/react-app.js
 *
 * Copies /3pd-ide/apps/0.starter-react/starter-template → /3pd-ide/apps/react---<name>
 * then runs `npm install` inside the new folder.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { log } from '../shared/log.js';
import { FRAMEWORK_PREFIXES } from '../shared/frameworks.js';

/**
 * Recursively copy a directory
 */
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

/**
 * Create .env from .env.example
 */
function setupEnvFile(appDir) {
  const envExample = path.join(appDir, '.env.example');
  const envFile    = path.join(appDir, '.env');

  if (!fs.existsSync(envExample)) {
    log.warn('No .env.example found — skipping .env creation.');
    return;
  }

  fs.copyFileSync(envExample, envFile);
  log.success('.env created from .env.example');
}

/**
 * Main command handler
 * @param {string} name - App name from CLI
 * @param {{ ideRoot: string, internal: boolean }} opts
 */
export default async function reactApp(name, { ideRoot }) {
  log.header("Create New React App");

  if (!ideRoot) {
    log.error("Missing ideRoot. CLI did not pass correct options.");
    process.exit(1);
  }

  // Support multi-word names (Commander passes arrays when using <name...>)
  const rawName = Array.isArray(name) ? name.join(' ') : name;

  const slug = rawName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')          // spaces → hyphens
    .replace(/[^a-z0-9\-]/g, '');  // remove invalid chars

  if (!slug) {
    log.error("Invalid app name.");
    process.exit(1);
  }

  const folderName = FRAMEWORK_PREFIXES.react + slug;

  const templateDir = path.join(ideRoot, 'apps', '0.starter-react', 'starter-template');
  const appDir      = path.join(ideRoot, 'apps', folderName);

  if (!fs.existsSync(templateDir)) {
    log.error("Starter template not found.");
    log.dim(`Expected at: ${templateDir}`);
    log.nl();
    log.dim("Create /3pd-ide/apps/0.starter-react/starter-template first.");
    process.exit(1);
  }

  if (fs.existsSync(appDir)) {
    log.error("App already exists.");
    log.dim(appDir);
    process.exit(1);
  }

  // Display paths
  log.info(`App Name: ${folderName}`);
  log.dim(`Template: ${templateDir}`);
  log.dim(`Destination: ${appDir}`);
  log.nl();

  // Copy template
  log.header("Copying Starter Template");
  copyRecursive(templateDir, appDir);
  log.success("Template copied.");

  // Create .env from .env.example
  log.header("Configuring Environment");
  setupEnvFile(appDir);

  // Patch package.json name
  const pkgPath = path.join(appDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.name = folderName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    log.success(`package.json updated → "${folderName}"`);
  }

  // Install dependencies
  log.header("Installing Dependencies");
  try {
    execSync('npm install', { cwd: appDir, stdio: 'inherit' });
  } catch (err) {
    log.error("npm install failed.");
    log.debug(err);
    process.exit(1);
  }

  // Final summary
  log.header("Summary");
  log.success(`React app "${folderName}" created successfully.`);
  log.dim('Next steps:');
  log.dim(`  cd apps/${folderName}`);
  log.dim('  npm run dev          # starts React (Vite) + Express together');
  log.dim('  3pd react module     # when ready to generate the Drupal block module');
  log.nl();
}
