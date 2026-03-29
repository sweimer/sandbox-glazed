/**
 * 3pd doctor
 * File: commands/doctor.js
 *
 * Environment diagnostics for the 3PD IDE.
 * Validates Node, npm, IDE structure, and Drupal root (internal mode).
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * @param {{ ideRoot: string, internal: boolean }} opts
 */
export default async function doctor({ ideRoot, internal }) {
  console.log('\n🔍  3PD IDE — Environment Diagnostics');
  console.log('    ─────────────────────────────────────────');

  // ────────────────────────────────────────────────────────────────
  // Runtime
  // ────────────────────────────────────────────────────────────────
  const nodeVersion = process.version;
  const nodeOk = parseInt(nodeVersion.slice(1), 10) >= 18;

  console.log('\n  Runtime');
  console.log(`    Node.js : ${nodeVersion}  ${nodeOk ? '✅' : '❌  (v18+ required)'}`);

  try {
    const npm = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`    npm     : v${npm}  ✅`);
  } catch {
    console.log('    npm     : ❌  not found');
  }

  // ────────────────────────────────────────────────────────────────
  // Mode
  // ────────────────────────────────────────────────────────────────
  console.log('\n  Mode');
  if (internal) {
    console.log('    🏠  Internal (HUDX) mode');
  } else {
    console.log('    🔓  3PD (third‑party developer) mode');
  }

  // ────────────────────────────────────────────────────────────────
  // Paths
  // ────────────────────────────────────────────────────────────────
  const check = (label, p) =>
    console.log(`    ${label.padEnd(16)}: ${p}  ${fs.existsSync(p) ? '✅' : '⚠️  not found'}`);

  console.log('\n  Paths');
  check('IDE root',         ideRoot);
  check('apps/',            path.join(ideRoot, 'apps'));
  check('react template',   path.join(ideRoot, 'apps', '0.starter-react', 'starter-template'));
  check('astro template',   path.join(ideRoot, 'apps', '0.starter-astro-static', 'starter-template'));
  check('astro create-mod', path.join(ideRoot, 'apps', '0.starter-astro-static', 'create-module.js'));

  // NEW: Drupal root detection (correct architecture)
  const drupalRoot = path.join(ideRoot, '..', 'web');
  const drupalModules = path.join(drupalRoot, 'modules', 'custom');

  if (internal) {
    console.log('\n  Drupal (Internal Mode)');
    check('Drupal root', drupalRoot);
    check('custom modules', drupalModules);
  }

  // ────────────────────────────────────────────────────────────────
  // Optional Tools
  // ────────────────────────────────────────────────────────────────
  console.log('\n  Optional Tools');
  for (const { label, cmd } of [
    { label: 'git', cmd: 'git --version' },
    { label: 'lando', cmd: 'lando version' },
    { label: 'drush', cmd: 'drush --version' },
  ]) {
    try {
      const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      console.log(`    ${label.padEnd(5)}: ${out}  ✅`);
    } catch {
      console.log(`    ${label.padEnd(5)}: ⚠️  not found`);
    }
  }

  console.log('\n    ─────────────────────────────────────────');
  console.log('  ✨  Diagnostics complete.\n');
}
