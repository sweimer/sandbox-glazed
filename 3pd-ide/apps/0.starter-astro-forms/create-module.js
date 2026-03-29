#!/usr/bin/env node

/**
 * HUDX Module Generator — Astro
 * Builds the Astro app and packages it as a Drupal block module.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ---------------------------------------------------------
// Utility: recursively copy a directory
// ---------------------------------------------------------
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ---------------------------------------------------------
// Utility: try running a command with fallback
// ---------------------------------------------------------
function tryExec(commands) {
  for (const cmd of commands) {
    try {
      execSync(cmd, { stdio: 'inherit' });
      return true;
    } catch {}
  }
  return false;
}

// Convert app-name → Human Name
function toHumanName(appName) {
  return appName
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

// ---------------------------------------------------------
// Map SQLite PRAGMA column type → Drupal schema field array
// ---------------------------------------------------------
function buildDrupalSchemaPhp(columns) {
  return columns.map((col) => {
    const t = (col.type || '').toUpperCase();
    let lines = `        '${col.name}' => [\n`;

    if (col.pk === 1) {
      lines += `          'type' => 'serial',\n          'unsigned' => TRUE,\n          'not null' => TRUE,\n`;
    } else if (t === 'INTEGER' || t === 'INT') {
      lines += `          'type' => 'int',\n          'not null' => FALSE,\n`;
    } else if (t === 'REAL' || t === 'FLOAT' || t === 'DOUBLE') {
      lines += `          'type' => 'float',\n          'not null' => FALSE,\n`;
    } else if (t === 'TEXT' || t === 'BLOB' || t === '') {
      lines += `          'type' => 'text',\n          'size' => 'big',\n          'not null' => FALSE,\n`;
    } else {
      // DATETIME, VARCHAR, CHAR, etc.
      lines += `          'type' => 'varchar',\n          'length' => 255,\n          'not null' => FALSE,\n`;
    }

    lines += `        ],`;
    return lines;
  }).join('\n');
}

// ---------------------------------------------------------
// Auto-detect Drupal root
// ---------------------------------------------------------
function findDrupalRoot(startDir) {
  let current = startDir;

  while (true) {
    const webDir        = path.join(current, 'web');
    const customModules = path.join(webDir, 'modules', 'custom');

    if (fs.existsSync(webDir) && fs.existsSync(customModules)) {
      return webDir;
    }

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

// ---------------------------------------------------------
// Read SQLite submissions table via a temp script
// Returns { columns: [], rows: [] } — empty on any failure
// ---------------------------------------------------------
function readSqlite(appRoot) {
  const dbPath = path.join(appRoot, 'server', 'db', 'app.sqlite');
  if (!fs.existsSync(dbPath)) {
    console.log('  ℹ  No SQLite DB found — seed data will be empty.');
    return { columns: [], rows: [] };
  }

  const tmpScript = path.join(appRoot, '_3pd_read_db.mjs');
  try {
    fs.writeFileSync(tmpScript, `
import Database from 'better-sqlite3';
const db = new Database(${JSON.stringify(dbPath)}, { readonly: true });
const rows = db.prepare('SELECT * FROM submissions ORDER BY id ASC').all();
const cols = db.prepare('PRAGMA table_info(submissions)').all();
db.close();
process.stdout.write(JSON.stringify({ rows, cols }));
`);
    const result = execSync(`node ${JSON.stringify(tmpScript)}`, { cwd: appRoot, encoding: 'utf8' });
    return JSON.parse(result);
  } catch (e) {
    console.log('  ⚠  Could not read SQLite — seed data will be empty.');
    return { columns: [], rows: [] };
  } finally {
    if (fs.existsSync(tmpScript)) fs.unlinkSync(tmpScript);
  }
}

// ---------------------------------------------------------
// MAIN EXPORTED FUNCTION
// ---------------------------------------------------------
export default async function createModule(appNameFromCli, { internal }) {
  console.log('\n📦 HUDX Module Generator (Astro)');

  const appRoot = process.cwd();
  const appName = appNameFromCli || path.basename(appRoot);

  console.log(`App name: ${appName}`);

  const machineName = `hudx_${appName.replace(/-/g, '_')}`;
  const hyphenName  = machineName.replace(/_/g, '-');
  const moduleDir   = path.join(appRoot, machineName);
  const tableName   = `${machineName}_submissions`;

  console.log(`Machine name:     ${machineName}`);
  console.log(`Hyphen name:      ${hyphenName}`);
  console.log(`Module directory: ${moduleDir}`);

  if (fs.existsSync(moduleDir)) {
    fs.rmSync(moduleDir, { recursive: true, force: true });
  }

  // Determine mode
  let is3PD = !internal;
  const drupalWebRoot = findDrupalRoot(appRoot);

  if (!is3PD && !drupalWebRoot) {
    console.log(`
⚠️  INTERNAL mode requested but no Drupal root found.
Falling back to 3PD mode.
`);
    is3PD = true;
  }

  const humanName   = toHumanName(appName);
  const displayName = `3PD IDE - ${humanName}`;

  const themeHookKey = `${machineName}_block`;
  const templateName = `${hyphenName}-block`;
  const twigFilename = `${templateName}.html.twig`;
  const mountId      = `${hyphenName}-root`;

  // ---------------------------------------------------------
  // Build Astro app
  // ---------------------------------------------------------
  console.log('\n🚀 Building Astro app...\n');
  execSync('npm run build', { stdio: 'inherit' });

  const distDir     = path.join(appRoot, 'dist');
  const astroAssets = path.join(distDir, '_astro');

  // Collect built JS and CSS from _astro/ (external bundle case)
  const allFiles = fs.existsSync(astroAssets) ? fs.readdirSync(astroAssets) : [];
  const jsFiles  = allFiles.filter((f) => f.endsWith('.js') && !f.endsWith('.map'));
  const cssFiles = allFiles.filter((f) => f.endsWith('.css'));

  const stableJsFile  = `${machineName}.js`;
  const stableCssFile = `${machineName}.css`;

  // If no external bundles, extract inline script/style/body from dist/index.html
  let inlineJs  = '';
  let inlineCss = '';
  let bodyHtml  = '';

  if (jsFiles.length === 0) {
    const htmlPath = path.join(distDir, 'index.html');
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, 'utf8');

      const scriptMatch = html.match(/<script type="module">([\s\S]*?)<\/script>/);
      if (scriptMatch) inlineJs = scriptMatch[1].trim();

      const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
      if (styleMatch) inlineCss = styleMatch[1].trim();

      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
      if (bodyMatch) bodyHtml = bodyMatch[1].trim();
    }
  }

  // Rename external bundles to stable filenames
  if (jsFiles.length > 0) {
    fs.renameSync(
      path.join(astroAssets, jsFiles[0]),
      path.join(astroAssets, stableJsFile)
    );
  }

  if (cssFiles.length > 0) {
    fs.renameSync(
      path.join(astroAssets, cssFiles[0]),
      path.join(astroAssets, stableCssFile)
    );
  }

  // ---------------------------------------------------------
  // Read SQLite — build seed data for Drupal DB
  // ---------------------------------------------------------
  console.log('\n🗃  Reading SQLite submissions...');
  const { cols: sqliteCols, rows: sqliteRows } = readSqlite(appRoot);
  const seedData = {
    table:   'submissions',
    columns: sqliteCols || [],
    rows:    sqliteRows || [],
  };
  console.log(`  ✔  ${seedData.rows.length} row(s) found.`);

  // ---------------------------------------------------------
  // Create module directory and copy assets
  // ---------------------------------------------------------
  fs.mkdirSync(moduleDir);

  const moduleAssetsDir = path.join(moduleDir, 'dist', 'assets');
  fs.mkdirSync(moduleAssetsDir, { recursive: true });

  if (jsFiles.length > 0 && fs.existsSync(astroAssets)) {
    // Case A: external bundles — copy from _astro/
    copyRecursive(astroAssets, moduleAssetsDir);
  } else {
    // Case B: inline script — write extracted assets
    if (inlineJs)  fs.writeFileSync(path.join(moduleAssetsDir, stableJsFile), inlineJs);
    if (inlineCss) fs.writeFileSync(path.join(moduleAssetsDir, stableCssFile), inlineCss);
  }

  // ---------------------------------------------------------
  // Write data/seed.json
  // ---------------------------------------------------------
  const dataDir = path.join(moduleDir, 'data');
  fs.mkdirSync(dataDir);
  fs.writeFileSync(path.join(dataDir, 'seed.json'), JSON.stringify(seedData, null, 2) + '\n');

  // ---------------------------------------------------------
  // Write .info.yml
  // ---------------------------------------------------------
  const infoYml = `
name: ${displayName}
type: module
description: '3PD IDE Astro application module for ${displayName}.'
core_version_requirement: ^10 || ^11
package: 3PD IDE Apps
`.trim() + '\n';

  fs.writeFileSync(path.join(moduleDir, `${machineName}.info.yml`), infoYml);

  // ---------------------------------------------------------
  // Write .module
  // ---------------------------------------------------------
  const modulePhp = `
<?php

/**
 * Implements hook_theme().
 */
function ${machineName}_theme($existing, $type, $theme, $path) {
  return [
    '${themeHookKey}' => [
      'variables' => [],
      'template' => '${templateName}',
      'path' => \\Drupal::service('extension.list.module')->getPath('${machineName}') . '/templates',
    ],
  ];
}
`.trim() + '\n';

  fs.writeFileSync(path.join(moduleDir, `${machineName}.module`), modulePhp);

  // ---------------------------------------------------------
  // Write .install — hook_schema + hook_install + _import_seed
  // ---------------------------------------------------------
  const schemaFields = seedData.columns.length
    ? buildDrupalSchemaPhp(seedData.columns)
    : `        'id' => [
          'type' => 'serial',
          'unsigned' => TRUE,
          'not null' => TRUE,
        ],
        'name' => [
          'type' => 'varchar',
          'length' => 255,
          'not null' => FALSE,
        ],
        'message' => [
          'type' => 'text',
          'size' => 'big',
          'not null' => FALSE,
        ],
        'created_at' => [
          'type' => 'varchar',
          'length' => 255,
          'not null' => FALSE,
        ],`;

  const installPhp = `<?php

/**
 * Implements hook_schema().
 *
 * Defines the submissions table for ${displayName}.
 * Created automatically by 3PD module generator — do not edit manually.
 */
function ${machineName}_schema() {
  return [
    '${tableName}' => [
      'description' => 'Form submissions for ${displayName}.',
      'fields' => [
${schemaFields}
      ],
      'primary key' => ['id'],
    ],
  ];
}

/**
 * Implements hook_install().
 *
 * Seeds the submissions table from data/seed.json on first install.
 */
function ${machineName}_install() {
  _${machineName}_import_seed();
}

/**
 * Import (or re-import) seed data from data/seed.json.
 *
 * Called by hook_install() on first enable, and by post_deploy.php on
 * every Pantheon deploy to keep seed data in sync with the committed JSON.
 * Truncates the table before inserting — existing submissions are replaced.
 */
function _${machineName}_import_seed() {
  $module_path = \\Drupal::service('extension.list.module')->getPath('${machineName}');
  $seed_file   = $module_path . '/data/seed.json';

  if (!file_exists($seed_file)) {
    return;
  }

  $seed = json_decode(file_get_contents($seed_file), TRUE);

  if (empty($seed['rows'])) {
    return;
  }

  $connection = \\Drupal::database();
  $connection->truncate('${tableName}')->execute();

  foreach ($seed['rows'] as $row) {
    unset($row['id']); // let the DB assign the serial ID
    $connection->insert('${tableName}')->fields($row)->execute();
  }
}
`;

  fs.writeFileSync(path.join(moduleDir, `${machineName}.install`), installPhp);

  // ---------------------------------------------------------
  // Write .libraries.yml
  // ---------------------------------------------------------
  const hasJs  = jsFiles.length > 0 || !!inlineJs;
  const hasCss = cssFiles.length > 0 || !!inlineCss;

  const jsSection = hasJs ? `  js:
    dist/assets/${stableJsFile}:
      header: true
      attributes:
        type: module` : '';

  const cssSection = hasCss ? `  css:
    theme:
      dist/assets/${stableCssFile}: {}` : '';

  const buildVersion = Date.now();

  const librariesYml = `
${machineName}:
  version: ${buildVersion}
${jsSection}
${cssSection}
  dependencies:
    - core/drupal
`.trim() + '\n';

  fs.writeFileSync(
    path.join(moduleDir, `${machineName}.libraries.yml`),
    librariesYml
  );

  // ---------------------------------------------------------
  // Block plugin
  // ---------------------------------------------------------
  const blockDir = path.join(moduleDir, 'src', 'Plugin', 'Block');
  fs.mkdirSync(blockDir, { recursive: true });

  const className =
    machineName
      .split('_')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('') + 'Block';

  const blockPhp = `
<?php

namespace Drupal\\${machineName}\\Plugin\\Block;

use Drupal\\Core\\Block\\BlockBase;

/**
 * Provides a '${displayName}' block.
 *
 * @Block(
 *   id = "${machineName}_block",
 *   admin_label = @Translation("${displayName}")
 * )
 */
class ${className} extends BlockBase {

  public function build() {
    return [
      '#theme' => '${themeHookKey}',
      '#attached' => [
        'library' => [
          '${machineName}/${machineName}',
        ],
      ],
    ];
  }

}
`.trim() + '\n';

  fs.writeFileSync(path.join(blockDir, `${className}.php`), blockPhp);

  // ---------------------------------------------------------
  // Twig template
  // ---------------------------------------------------------
  const templatesDir = path.join(moduleDir, 'templates');
  fs.mkdirSync(templatesDir);

  // Case A (external bundle): mount div for client-side hydration
  // Case B (inline script): full body HTML from the Astro build
  const twig = (jsFiles.length > 0 || !bodyHtml)
    ? `<div id="${mountId}"></div>\n`
    : `${bodyHtml}\n`;
  fs.writeFileSync(path.join(templatesDir, twigFilename), twig);

  // ---------------------------------------------------------
  // Submissions API controller
  // Handles GET /api/submissions and POST /api/submissions.
  // Replaces the local Express/SQLite backend when running inside Drupal.
  // ---------------------------------------------------------
  const controllerDir = path.join(moduleDir, 'src', 'Controller');
  fs.mkdirSync(controllerDir, { recursive: true });

  const submissionsControllerPhp = `<?php

namespace Drupal\\${machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;
use Symfony\\Component\\HttpFoundation\\JsonResponse;
use Symfony\\Component\\HttpFoundation\\Request;

/**
 * REST-like API for form submissions — mirrors the local Express server.
 *
 * GET  /api/submissions  — returns all rows, newest first.
 * POST /api/submissions  — inserts a new row.
 *
 * Generated by 3PD module generator — do not edit manually.
 */
class SubmissionsController extends ControllerBase {

  public function list(): JsonResponse {
    $rows = \\Drupal::database()
      ->select('${tableName}', 's')
      ->fields('s')
      ->orderBy('s.id', 'DESC')
      ->execute()
      ->fetchAll(\\PDO::FETCH_ASSOC);

    return new JsonResponse(array_values($rows));
  }

  public function submit(Request $request): JsonResponse {
    $data = json_decode($request->getContent(), TRUE);

    if (empty($data['name']) || empty($data['message'])) {
      return new JsonResponse(['error' => 'name and message are required.'], 400);
    }

    \\Drupal::database()
      ->insert('${tableName}')
      ->fields([
        'name'       => $data['name'],
        'message'    => $data['message'],
        'created_at' => date('Y-m-d H:i:s'),
      ])
      ->execute();

    return new JsonResponse(['status' => 'ok'], 201);
  }

}
`;

  fs.writeFileSync(path.join(controllerDir, 'SubmissionsController.php'), submissionsControllerPhp);

  // ---------------------------------------------------------
  // Test page controller
  // Provides /hudx-test/<appName> for development testing.
  // NOTE: gate or remove before production. See LOG.txt CI/CD notes.
  // ---------------------------------------------------------
  const testControllerPhp = `
<?php

namespace Drupal\\${machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;

/**
 * Test page controller for ${displayName}.
 *
 * Renders the block at /hudx-test/${appName} for development testing.
 * NOTE: Remove or gate this route before production deployment.
 */
class HudxTestController extends ControllerBase {

  public function page() {
    return [
      '#theme' => '${themeHookKey}',
      '#attached' => [
        'library' => [
          '${machineName}/${machineName}',
        ],
      ],
    ];
  }

}
`.trim() + '\n';

  fs.writeFileSync(path.join(controllerDir, 'HudxTestController.php'), testControllerPhp);

  // ---------------------------------------------------------
  // Write .routing.yml — test page + submissions API
  // ---------------------------------------------------------
  const routingYml = `
${machineName}.test_page:
  path: '/hudx-test/${appName}'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\HudxTestController::page'
    _title: 'HUDX Test: ${appName}'
  requirements:
    _permission: 'access content'

${machineName}.api_submissions_list:
  path: '/api/submissions'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\SubmissionsController::list'
    _title: 'Submissions'
  methods: [GET]
  requirements:
    _permission: 'access content'

${machineName}.api_submissions_create:
  path: '/api/submissions'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\SubmissionsController::submit'
    _title: 'Create Submission'
  methods: [POST]
  requirements:
    _permission: 'access content'
`.trim() + '\n';

  fs.writeFileSync(path.join(moduleDir, `${machineName}.routing.yml`), routingYml);

  // ---------------------------------------------------------
  // 3PD mode ends here
  // ---------------------------------------------------------
  if (is3PD) {
    console.log('\n🎉 HUDX Drupal module created successfully!');
    console.log(`📍 Location: ${moduleDir}`);
    console.log(`🔗 Test route will be available at: /hudx-test/${appName}\n`);
    return;
  }

  // ---------------------------------------------------------
  // INTERNAL MODE
  // ---------------------------------------------------------
  console.log('\n🔧 INTERNAL MODE ENABLED');

  const drupalModuleDir = path.join(
    drupalWebRoot,
    'modules',
    'custom',
    machineName
  );

  if (fs.existsSync(drupalModuleDir)) {
    fs.rmSync(drupalModuleDir, { recursive: true, force: true });
  }

  copyRecursive(moduleDir, drupalModuleDir);

  console.log('\n⚙️  Reinstalling module (uninstall → enable runs hook_schema + hook_install)...');
  tryExec([`lando ssh -c "cd /app && drush pm:uninstall ${machineName} -y"`]);
  const enabled = tryExec([
    `lando ssh -c "cd /app && drush en ${machineName} -y"`,
    `lando ssh -c "cd /app && drush php:eval \\"\\\\Drupal::service('module_installer')->install(['${machineName}']);\\""`
  ]);
  if (!enabled) console.log(`  ⚠  Could not enable automatically. Run: lando drush pm:uninstall ${machineName} -y && lando drush en ${machineName} -y`);

  console.log('\n🧹 Clearing caches...');
  const cleared = tryExec([`lando crx`]);
  if (!cleared) console.log('  ⚠  Could not clear caches automatically. Run: lando crx');

  console.log('\n🔀 Rebuilding router...');
  try {
    const repoRoot = path.dirname(drupalWebRoot);
    execSync(`lando drush php:eval "\\Drupal::service('router.builder')->rebuild();"`, { stdio: 'inherit', cwd: repoRoot });
  } catch {
    console.log('  ⚠  Could not rebuild router automatically. Run: lando drush php:eval "\\Drupal::service(\'router.builder\')->rebuild();"');
  }

  // Resolve test page URL from Drupal site URI
  let siteUri = '';
  try {
    siteUri = execSync('lando ssh -c "cd /app && drush status --field=uri" 2>/dev/null', { encoding: 'utf8' }).trim();
  } catch {}
  const testUrl = siteUri ? `${siteUri}/hudx-test/${appName}` : `/hudx-test/${appName}`;

  console.log('\n🎉 HUDX Drupal module created and installed!');
  console.log(`📍 Module: ${drupalModuleDir}`);
  console.log(`🔗 Test page: ${testUrl}\n`);
}
