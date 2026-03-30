#!/usr/bin/env node

/**
 * HUDX Module Generator — 3PD Module Checklist
 *
 * Custom create-module.js for the 3pd-checklist app.
 * Overrides the generic astro-forms create-module.js because this app needs:
 *   - A ChecklistController (not SubmissionsController)
 *   - Three API routes: /modules, /checklist (GET), /checklist (POST)
 *   - INSERT-if-not-exists seed logic (preserve existing checklist state on redeploy)
 *   - UNIQUE constraint on module_name in the Drupal schema
 *
 * Invoked by: 3pd astro-forms module [--install]
 * (astro-forms-module.js checks for a local create-module.js first)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ---------------------------------------------------------
// Utilities
// ---------------------------------------------------------
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(srcPath, destPath);
    else                     fs.copyFileSync(srcPath, destPath);
  }
}

function tryExec(commands) {
  for (const cmd of commands) {
    try { execSync(cmd, { stdio: 'inherit' }); return true; } catch {}
  }
  return false;
}

function findDrupalRoot(startDir) {
  let current = startDir;
  while (true) {
    const webDir = path.join(current, 'web');
    if (fs.existsSync(webDir) && fs.existsSync(path.join(webDir, 'modules', 'custom'))) return webDir;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

// ---------------------------------------------------------
// Read SQLite checklist table for seed data
// ---------------------------------------------------------
function readChecklist(appRoot) {
  const dbPath = path.join(appRoot, 'server', 'db', 'app.sqlite');
  if (!fs.existsSync(dbPath)) {
    console.log('  ℹ  No SQLite DB found — seed data will be empty.');
    return [];
  }

  const tmpScript = path.join(appRoot, '_3pd_read_checklist.mjs');
  try {
    fs.writeFileSync(tmpScript, `
import Database from 'better-sqlite3';
const db = new Database(${JSON.stringify(dbPath)}, { readonly: true });
const rows = db.prepare('SELECT * FROM checklist ORDER BY id ASC').all();
db.close();
process.stdout.write(JSON.stringify(rows));
`);
    const result = execSync(`node ${JSON.stringify(tmpScript)}`, { cwd: appRoot, encoding: 'utf8' });
    const rows = JSON.parse(result);
    console.log(`  ✔  ${rows.length} checklist row(s) found.`);
    return rows;
  } catch (e) {
    console.log('  ⚠  Could not read SQLite — seed data will be empty.');
    return [];
  } finally {
    if (fs.existsSync(tmpScript)) fs.unlinkSync(tmpScript);
  }
}

// ---------------------------------------------------------
// MAIN
// ---------------------------------------------------------
export default async function createModule(appNameFromCli, { internal }) {
  console.log('\n📦 HUDX Module Generator (3PD Checklist)');

  const appRoot    = process.cwd();
  const appName    = appNameFromCli || path.basename(appRoot);
  const machineName = `hudx_${appName.replace(/-/g, '_')}`;
  const hyphenName  = machineName.replace(/_/g, '-');
  const moduleDir   = path.join(appRoot, machineName);
  const tableName   = `${machineName}_checklist`;

  console.log(`App name:         ${appName}`);
  console.log(`Machine name:     ${machineName}`);
  console.log(`Module directory: ${moduleDir}`);

  if (fs.existsSync(moduleDir)) fs.rmSync(moduleDir, { recursive: true, force: true });

  let is3PD = !internal;
  const drupalWebRoot = findDrupalRoot(appRoot);
  if (!is3PD && !drupalWebRoot) { is3PD = true; }

  const displayName  = '3PD IDE - 3PD Module Checklist';
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
  const allFiles    = fs.existsSync(astroAssets) ? fs.readdirSync(astroAssets) : [];
  const jsFiles     = allFiles.filter(f => f.endsWith('.js') && !f.endsWith('.map'));
  const cssFiles    = allFiles.filter(f => f.endsWith('.css'));

  const stableJsFile  = `${machineName}.js`;
  const stableCssFile = `${machineName}.css`;

  let inlineJs = '', inlineCss = '', bodyHtml = '';

  // Always extract body HTML — Astro SSG renders the page structure at build time.
  // The JS bundle adds interactivity to existing DOM elements; without the body
  // HTML the twig would be a bare mount div and the JS would fail silently because
  // elements like #load-status, #checklist-table etc. would not exist in the DOM.
  // Script and link tags are stripped — libraries.yml handles asset loading.
  const distHtmlPath = path.join(distDir, 'index.html');
  if (fs.existsSync(distHtmlPath)) {
    const html = fs.readFileSync(distHtmlPath, 'utf8');

    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    if (bodyMatch) {
      bodyHtml = bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<link[^>]*\/?>/gi, '')
        .trim();
    }

    // For inline bundles (no external JS file), also extract JS + CSS for assets
    if (jsFiles.length === 0) {
      const scriptMatch = html.match(/<script type="module">([\s\S]*?)<\/script>/);
      if (scriptMatch) inlineJs = scriptMatch[1].trim();
      const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
      if (styleMatch) inlineCss = styleMatch[1].trim();
    }
  }

  if (jsFiles.length > 0) {
    fs.renameSync(path.join(astroAssets, jsFiles[0]), path.join(astroAssets, stableJsFile));
  }
  if (cssFiles.length > 0) {
    fs.renameSync(path.join(astroAssets, cssFiles[0]), path.join(astroAssets, stableCssFile));
  }

  // ---------------------------------------------------------
  // Read seed data from SQLite
  // ---------------------------------------------------------
  console.log('\n🗃  Reading SQLite checklist...');
  const seedRows = readChecklist(appRoot);

  // ---------------------------------------------------------
  // Create module directory and copy assets
  // ---------------------------------------------------------
  fs.mkdirSync(moduleDir);
  const moduleAssetsDir = path.join(moduleDir, 'dist', 'assets');
  fs.mkdirSync(moduleAssetsDir, { recursive: true });

  if (jsFiles.length > 0 && fs.existsSync(astroAssets)) {
    copyRecursive(astroAssets, moduleAssetsDir);
  } else {
    if (inlineJs)  fs.writeFileSync(path.join(moduleAssetsDir, stableJsFile), inlineJs);
    if (inlineCss) fs.writeFileSync(path.join(moduleAssetsDir, stableCssFile), inlineCss);
  }

  // ---------------------------------------------------------
  // Write data/seed.json
  // ---------------------------------------------------------
  const dataDir = path.join(moduleDir, 'data');
  fs.mkdirSync(dataDir);
  fs.writeFileSync(
    path.join(dataDir, 'seed.json'),
    JSON.stringify({ table: 'checklist', rows: seedRows }, null, 2) + '\n'
  );

  // ---------------------------------------------------------
  // Write .info.yml
  // ---------------------------------------------------------
  fs.writeFileSync(path.join(moduleDir, `${machineName}.info.yml`), `
name: ${displayName}
type: module
description: '3PD module test checklist — tracks which 3PD modules have been verified.'
core_version_requirement: ^10 || ^11
package: 3PD IDE Apps
`.trim() + '\n');

  // ---------------------------------------------------------
  // Write .module
  // ---------------------------------------------------------
  fs.writeFileSync(path.join(moduleDir, `${machineName}.module`), `<?php

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
`);

  // ---------------------------------------------------------
  // Write .install — hook_schema + hook_install + _import_seed
  // Seed logic uses INSERT-if-not-exists so existing checklist state
  // on Pantheon is preserved across deploys.
  // ---------------------------------------------------------
  const installPhp = `<?php

/**
 * Implements hook_schema().
 *
 * Defines the checklist table for the 3PD Module Checklist.
 * Generated by 3PD module generator — do not edit manually.
 */
function ${machineName}_schema() {
  return [
    '${tableName}' => [
      'description' => '3PD module test checklist — one row per module.',
      'fields' => [
        'id' => [
          'type'     => 'serial',
          'unsigned' => TRUE,
          'not null' => TRUE,
        ],
        'module_name' => [
          'type'     => 'varchar',
          'length'   => 255,
          'not null' => TRUE,
        ],
        'tech_type' => [
          'type'     => 'varchar',
          'length'   => 255,
          'not null' => FALSE,
        ],
        'display_name' => [
          'type'     => 'varchar',
          'length'   => 255,
          'not null' => FALSE,
        ],
        'checked' => [
          'type'     => 'int',
          'not null' => FALSE,
          'default'  => 0,
        ],
        'tester_name' => [
          'type'     => 'varchar',
          'length'   => 255,
          'not null' => FALSE,
        ],
        'workflow_status' => [
          'type'     => 'varchar',
          'length'   => 255,
          'not null' => FALSE,
          'default'  => 'Not Tested',
        ],
      ],
      'primary key' => ['id'],
      'unique keys' => [
        'module_name' => ['module_name'],
      ],
    ],
  ];
}

/**
 * Implements hook_install().
 */
function ${machineName}_install() {
  _${machineName}_import_seed();
}

/**
 * Seed the checklist table from data/seed.json.
 *
 * Uses INSERT-if-not-exists so existing production checklist state
 * is never overwritten by a redeploy.
 * Called by hook_install() on first enable, and by post_deploy.php
 * on every Pantheon deploy to seed newly added modules.
 */
function _${machineName}_import_seed() {
  $module_path = \\Drupal::service('extension.list.module')->getPath('${machineName}');
  $seed_file   = $module_path . '/data/seed.json';

  if (!file_exists($seed_file)) return;

  $seed = json_decode(file_get_contents($seed_file), TRUE);
  if (empty($seed['rows'])) return;

  $connection = \\Drupal::database();

  foreach ($seed['rows'] as $row) {
    // Only insert if this module_name doesn't already have a row.
    // This preserves tester sign-offs made directly in Drupal/Pantheon.
    $exists = $connection->select('${tableName}', 'c')
      ->fields('c', ['id'])
      ->condition('module_name', $row['module_name'])
      ->execute()
      ->fetchField();

    if (!$exists) {
      unset($row['id']);
      $connection->insert('${tableName}')->fields($row)->execute();
    }
  }
}
`;

  fs.writeFileSync(path.join(moduleDir, `${machineName}.install`), installPhp);

  // ---------------------------------------------------------
  // Write .libraries.yml
  // ---------------------------------------------------------
  const hasJs  = jsFiles.length > 0 || !!inlineJs;
  const hasCss = cssFiles.length > 0 || !!inlineCss;

  const jsSection = hasJs ? `  js:\n    dist/assets/${stableJsFile}:\n      header: true\n      attributes:\n        type: module` : '';
  const cssSection = hasCss ? `  css:\n    theme:\n      dist/assets/${stableCssFile}: {}` : '';

  fs.writeFileSync(path.join(moduleDir, `${machineName}.libraries.yml`), `
${machineName}:
  version: ${Date.now()}
${jsSection}
${cssSection}
  dependencies:
    - core/drupal
`.trim() + '\n');

  // ---------------------------------------------------------
  // Block plugin
  // ---------------------------------------------------------
  const blockDir = path.join(moduleDir, 'src', 'Plugin', 'Block');
  fs.mkdirSync(blockDir, { recursive: true });

  const className = machineName.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') + 'Block';

  fs.writeFileSync(path.join(blockDir, `${className}.php`), `<?php

namespace Drupal\\${machineName}\\Plugin\\Block;

use Drupal\\Core\\Block\\BlockBase;

/**
 * @Block(
 *   id = "${machineName}_block",
 *   admin_label = @Translation("${displayName}")
 * )
 */
class ${className} extends BlockBase {
  public function build() {
    return [
      '#theme'    => '${themeHookKey}',
      '#attached' => ['library' => ['${machineName}/${machineName}']],
    ];
  }
}
`);

  // ---------------------------------------------------------
  // Twig template
  // ---------------------------------------------------------
  const templatesDir = path.join(moduleDir, 'templates');
  fs.mkdirSync(templatesDir);
  const twig = bodyHtml ? `${bodyHtml}\n` : `<div id="${mountId}"></div>\n`;
  fs.writeFileSync(path.join(templatesDir, twigFilename), twig);

  // ---------------------------------------------------------
  // ChecklistController
  // Handles:
  //   GET  /api/${appName}/modules   — installed hudx_* modules with tech type
  //   GET  /api/${appName}/checklist — all checklist rows
  //   POST /api/${appName}/checklist — upsert by module_name
  // ---------------------------------------------------------
  const controllerDir = path.join(moduleDir, 'src', 'Controller');
  fs.mkdirSync(controllerDir, { recursive: true });

  const checklistControllerPhp = `<?php

namespace Drupal\\${machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;
use Symfony\\Component\\HttpFoundation\\JsonResponse;
use Symfony\\Component\\HttpFoundation\\Request;

/**
 * Checklist API controller for 3PD Module Checklist.
 *
 * GET  /api/${appName}/modules   — list installed hudx_* modules with tech type.
 * GET  /api/${appName}/checklist — return all checklist rows.
 * POST /api/${appName}/checklist — upsert a row by module_name.
 *
 * Mirrors the local Express server for production use.
 * Generated by 3PD module generator — do not edit manually.
 */
class ChecklistController extends ControllerBase {

  /**
   * Returns all installed hudx_* modules with parsed tech type and display name.
   *
   * Drupal machine names follow the pattern: hudx_{framework}___{slug}
   * e.g. hudx_react___3pd_depot → module_name: "react---3pd-depot", tech_type: "React"
   * All underscores become hyphens to recover the original folder name.
   */
  public function modules(): JsonResponse {
    $installed = \\Drupal::service('extension.list.module')->getAllInstalledInfo();

    $tech_prefixes = [
      'hudx_astro_forms___' => 'Astro Forms',
      'hudx_react___'       => 'React',
      'hudx_astro___'       => 'Astro',
      'hudx_embed___'       => 'Smart Embed',
    ];

    $result = [];
    foreach ($installed as $machine => $info) {
      if ($machine === '${machineName}') continue; // skip self

      foreach ($tech_prefixes as $prefix => $tech_type) {
        if (strpos($machine, $prefix) === 0) {
          // Recover folder name: strip 'hudx_', replace all _ with -
          $app_name     = str_replace('_', '-', substr($machine, 5));
          // Use the module's own name from .info.yml (e.g. "3PD IDE - Astro Forms App 12")
          $display_name = $info['name'] ?? $app_name;

          $result[] = [
            'module_name'  => $app_name,
            'tech_type'    => $tech_type,
            'display_name' => $display_name,
          ];
          break;
        }
      }
    }

    return new JsonResponse($result);
  }

  /**
   * Returns all checklist rows, ordered by id.
   */
  public function list(): JsonResponse {
    $rows = \\Drupal::database()
      ->select('${tableName}', 'c')
      ->fields('c')
      ->orderBy('c.id', 'ASC')
      ->execute()
      ->fetchAll(\\PDO::FETCH_ASSOC);

    return new JsonResponse(array_values($rows));
  }

  /**
   * Upserts a checklist row by module_name.
   * Creates the row if it does not exist, updates it if it does.
   */
  public function upsert(Request $request): JsonResponse {
    $data = json_decode($request->getContent(), TRUE);

    if (empty($data['module_name'])) {
      return new JsonResponse(['error' => 'module_name is required.'], 400);
    }

    $db          = \\Drupal::database();
    $module_name = $data['module_name'];
    $checked     = !empty($data['checked']) ? 1 : 0;
    $tester_name = $data['tester_name'] ?? '';
    $valid_statuses = ['Not Tested', 'Tested', 'Returned', 'Approved', 'Ready for Deploy', 'Deployed'];
    $workflow_status = in_array($data['workflow_status'] ?? '', $valid_statuses)
      ? $data['workflow_status']
      : 'Not Tested';

    $existing = $db->select('${tableName}', 'c')
      ->fields('c', ['id'])
      ->condition('module_name', $module_name)
      ->execute()
      ->fetchField();

    if ($existing) {
      $db->update('${tableName}')
        ->fields([
          'tech_type'       => $data['tech_type']    ?? '',
          'display_name'    => $data['display_name'] ?? '',
          'checked'         => $checked,
          'tester_name'     => $tester_name,
          'workflow_status' => $workflow_status,
        ])
        ->condition('module_name', $module_name)
        ->execute();
    }
    else {
      $db->insert('${tableName}')
        ->fields([
          'module_name'     => $module_name,
          'tech_type'       => $data['tech_type']    ?? '',
          'display_name'    => $data['display_name'] ?? '',
          'checked'         => $checked,
          'tester_name'     => $tester_name,
          'workflow_status' => $workflow_status,
        ])
        ->execute();
    }

    $row = $db->select('${tableName}', 'c')
      ->fields('c')
      ->condition('module_name', $module_name)
      ->execute()
      ->fetchAssoc();

    return new JsonResponse($row);
  }

}
`;

  fs.writeFileSync(path.join(controllerDir, 'ChecklistController.php'), checklistControllerPhp);

  // ---------------------------------------------------------
  // Test page controller
  // ---------------------------------------------------------
  fs.writeFileSync(path.join(controllerDir, 'HudxTestController.php'), `<?php

namespace Drupal\\${machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;

/**
 * Test page controller — renders the block at /hudx-test/${appName}.
 * Remove or gate this route before production deployment.
 */
class HudxTestController extends ControllerBase {
  public function page() {
    return [
      '#theme'    => '${themeHookKey}',
      '#attached' => ['library' => ['${machineName}/${machineName}']],
    ];
  }
}
`);

  // ---------------------------------------------------------
  // Write .routing.yml — test page + 3 checklist API routes
  // ---------------------------------------------------------
  fs.writeFileSync(path.join(moduleDir, `${machineName}.routing.yml`), `
${machineName}.test_page:
  path: '/hudx-test/${appName}'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\HudxTestController::page'
    _title: 'HUDX Test: ${appName}'
  requirements:
    _permission: 'access content'

${machineName}.api_modules:
  path: '/api/${appName}/modules'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\ChecklistController::modules'
    _title: '3PD Modules'
  methods: [GET]
  requirements:
    _permission: 'access content'

${machineName}.api_checklist_list:
  path: '/api/${appName}/checklist'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\ChecklistController::list'
    _title: 'Checklist'
  methods: [GET]
  requirements:
    _permission: 'access content'

${machineName}.api_checklist_upsert:
  path: '/api/${appName}/checklist'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\ChecklistController::upsert'
    _title: 'Upsert Checklist Row'
  methods: [POST]
  requirements:
    _permission: 'access content'
`.trim() + '\n');

  // ---------------------------------------------------------
  // 3PD mode ends here
  // ---------------------------------------------------------
  if (is3PD) {
    console.log('\n🎉 HUDX Drupal module created successfully!');
    console.log(`📍 Location: ${moduleDir}`);
    console.log(`🔗 Test route: /hudx-test/${appName}\n`);
    return;
  }

  // ---------------------------------------------------------
  // INTERNAL MODE — copy to Drupal + enable
  // ---------------------------------------------------------
  console.log('\n🔧 INTERNAL MODE ENABLED');

  const drupalModuleDir = path.join(drupalWebRoot, 'modules', 'custom', machineName);
  if (fs.existsSync(drupalModuleDir)) fs.rmSync(drupalModuleDir, { recursive: true, force: true });
  copyRecursive(moduleDir, drupalModuleDir);

  console.log('\n⚙️  Reinstalling module...');
  tryExec([`lando ssh -c "cd /app && drush pm:uninstall ${machineName} -y"`]);
  const enabled = tryExec([
    `lando ssh -c "cd /app && drush en ${machineName} -y"`,
    `lando ssh -c "cd /app && drush php:eval \\"\\\\Drupal::service('module_installer')->install(['${machineName}']);\\""`
  ]);
  if (!enabled) console.log(`  ⚠  Could not enable automatically. Run: lando drush pm:uninstall ${machineName} -y && lando drush en ${machineName} -y`);

  console.log('\n🧹 Clearing caches...');
  tryExec([`lando crx`]);

  console.log('\n🔀 Rebuilding router...');
  try {
    execSync(`lando drush php:eval "\\Drupal::service('router.builder')->rebuild();"`, {
      stdio: 'inherit',
      cwd: path.dirname(drupalWebRoot),
    });
  } catch {
    console.log('  ⚠  Run manually: lando drush php:eval "\\Drupal::service(\'router.builder\')->rebuild();"');
  }

  let siteUri = '';
  try {
    siteUri = execSync('lando ssh -c "cd /app && drush status --field=uri" 2>/dev/null', { encoding: 'utf8' }).trim();
  } catch {}
  const testUrl = siteUri ? `${siteUri}/hudx-test/${appName}` : `/hudx-test/${appName}`;

  console.log('\n🎉 HUDX Drupal module created and installed!');
  console.log(`📍 Module:    ${drupalModuleDir}`);
  console.log(`🔗 Test page: ${testUrl}\n`);
}
