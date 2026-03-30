#!/usr/bin/env node

/**
 * HUDX Module Generator — React
 * Builds the React app and packages it as a Drupal block module.
 * Mirrors the 0.starter-astro-forms pattern:
 *   - Reads local SQLite, bakes rows into data/seed.json
 *   - Generates hook_schema() + hook_install() in .install
 *   - Generates SubmissionsController.php for same-origin API on Drupal
 *   - Namespaces API routes with APP_SLUG to avoid conflicts between apps
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

// ---------------------------------------------------------
// AST-SAFE MemoryRouter enforcement
// ---------------------------------------------------------
function enforceMemoryRouter(appFilePath) {
  const source = fs.readFileSync(appFilePath, 'utf8');

  const ast = parser.parse(source, {
    sourceType: 'module',
    plugins: ['jsx'],
  });

  traverse.default(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === 'react-router-dom') {
        path.node.specifiers = path.node.specifiers.filter(
          (s) => !(s.imported && s.imported.name === 'BrowserRouter')
        );

        const hasMR = path.node.specifiers.some(
          (s) => s.imported && s.imported.name === 'MemoryRouter'
        );

        if (!hasMR) {
          path.node.specifiers.push(
            t.importSpecifier(
              t.identifier('MemoryRouter'),
              t.identifier('MemoryRouter')
            )
          );
        }
      }
    },

    JSXElement(path) {
      const openingName = path.node.openingElement.name;
      if (t.isJSXIdentifier(openingName) && openingName.name === 'BrowserRouter') {
        const children = path.node.children || [];
        if (children.length === 1) {
          path.replaceWith(children[0]);
        } else {
          path.replaceWithMultiple(children);
        }
      }
    },

    ReturnStatement(path) {
      const argument = path.node.argument;
      if (!argument) return;

      if (
        t.isJSXElement(argument) &&
        t.isJSXIdentifier(argument.openingElement.name) &&
        argument.openingElement.name.name === 'MemoryRouter'
      ) {
        return;
      }

      path.node.argument = t.jsxElement(
        t.jsxOpeningElement(t.jsxIdentifier('MemoryRouter'), []),
        t.jsxClosingElement(t.jsxIdentifier('MemoryRouter')),
        [argument],
        false
      );
    },
  });

  const output = generate.default(ast, { retainLines: true }).code;
  fs.writeFileSync(appFilePath, output, 'utf8');
}

// ---------------------------------------------------------
// Utility: recursively copy a directory
// ---------------------------------------------------------
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });

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

// ---------------------------------------------------------
// Convert app-name → Human Name
// ---------------------------------------------------------
function toHumanName(appName) {
  return appName
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

// ---------------------------------------------------------
// Auto-detect Drupal root
// ---------------------------------------------------------
function findDrupalRoot(startDir) {
  let current = startDir;
  while (true) {
    const webDir        = path.join(current, 'web');
    const customModules = path.join(webDir, 'modules', 'custom');
    if (fs.existsSync(webDir) && fs.existsSync(customModules)) return webDir;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
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
// Read SQLite submissions table via a temp script.
// Returns { columns: [], rows: [], tableName: 'submissions' }
// Returns empty gracefully if DB doesn't exist or fails.
// ---------------------------------------------------------
function readSqlite(appRoot) {
  const dbPath = path.join(appRoot, 'server', 'db', 'app.sqlite');
  if (!fs.existsSync(dbPath)) {
    console.log('  ℹ  No SQLite DB found — seed data will be empty.');
    return { columns: [], rows: [], tableName: 'submissions' };
  }

  const tmpScript = path.join(appRoot, '_3pd_read_db.mjs');
  try {
    fs.writeFileSync(tmpScript, `
import Database from 'better-sqlite3';
const db = new Database(${JSON.stringify(dbPath)}, { readonly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
const tbl = tables[0]?.name || 'submissions';
const rows = db.prepare('SELECT * FROM ' + tbl + ' ORDER BY id ASC').all();
const cols = db.prepare('PRAGMA table_info(' + tbl + ')').all();
db.close();
process.stdout.write(JSON.stringify({ rows, cols, tableName: tbl }));
`);
    const result = execSync(`node ${JSON.stringify(tmpScript)}`, { cwd: appRoot, encoding: 'utf8' });
    return JSON.parse(result);
  } catch {
    console.log('  ⚠  Could not read SQLite — seed data will be empty.');
    return { columns: [], rows: [], tableName: 'submissions' };
  } finally {
    if (fs.existsSync(tmpScript)) fs.unlinkSync(tmpScript);
  }
}

// ---------------------------------------------------------
// MAIN EXPORTED FUNCTION
// ---------------------------------------------------------
export default async function createModule(appNameFromCli, { internal }) {
  console.log('\n📦 HUDX Module Generator (React)');

  const appRoot = process.cwd();
  const appName = appNameFromCli || path.basename(appRoot);

  console.log(`App name: ${appName}`);

  const machineName = `hudx_${appName.replace(/-/g, '_')}`;
  const hyphenName  = machineName.replace(/_/g, '-');
  const moduleDir   = path.join(appRoot, machineName);

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
    console.log('\n⚠️  INTERNAL mode requested but no Drupal root found.\nFalling back to 3PD mode.\n');
    is3PD = true;
  }

  const humanName   = toHumanName(appName);
  const displayName = `3PD IDE - ${humanName}`;

  const themeHookKey = `${machineName}_block`;
  const templateName = `${hyphenName}-block`;
  const twigFilename = `${templateName}.html.twig`;
  const mountId      = `${hyphenName}-root`;

  // ---------------------------------------------------------
  // Rewrite main.jsx
  // ---------------------------------------------------------
  const entryFile = path.join(appRoot, 'src', 'main.jsx');

  const behaviorName =
    machineName
      .split('_')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('') + 'Behavior';

  const entryContent = `
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

function mountHudxReactApp(context = document) {
  const el = context.getElementById
    ? context.getElementById("${mountId}")
    : document.getElementById("${mountId}");

  if (!el) return;

  if (!el.__hudxReactRoot) {
    el.__hudxReactRoot = ReactDOM.createRoot(el);
  }

  el.__hudxReactRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

function waitForMount() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mountHudxReactApp());
  } else {
    mountHudxReactApp();
  }
}

waitForMount();

if (typeof window !== "undefined" && window.Drupal && window.Drupal.behaviors) {
  (function (Drupal) {
    Drupal.behaviors.${behaviorName} = {
      attach(context) {
        mountHudxReactApp(context);
      },
    };
  })(window.Drupal);
}
`.trim() + '\n';

  fs.writeFileSync(entryFile, entryContent, 'utf8');
  console.log('🛠  Updated main.jsx');

  // ---------------------------------------------------------
  // Enforce MemoryRouter
  // ---------------------------------------------------------
  const appFile = path.join(appRoot, 'src', 'App.jsx');
  enforceMemoryRouter(appFile);
  console.log('✔  MemoryRouter enforced');

  // ---------------------------------------------------------
  // Rewrite index.html
  // ---------------------------------------------------------
  const indexHtmlPath = path.join(appRoot, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    indexHtml = indexHtml.replace(/<div id="root"><\/div>/g, `<div id="${mountId}"></div>`);
    fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
    console.log('🛠  Updated index.html');
  }

  // ---------------------------------------------------------
  // Read SQLite — build seed data for Drupal DB
  // ---------------------------------------------------------
  console.log('\n🗃  Reading SQLite submissions...');
  const { cols: sqliteCols, rows: sqliteRows, tableName: sqliteTableName } = readSqlite(appRoot);
  const seedData = {
    table:   sqliteTableName || 'submissions',
    columns: sqliteCols  || [],
    rows:    sqliteRows  || [],
  };
  const drupalTableName = `${machineName}_${seedData.table}`;
  console.log(`  ✔  ${seedData.rows.length} row(s) found.`);

  // ---------------------------------------------------------
  // Build React app
  // ---------------------------------------------------------
  console.log('\n⚛️  Building React app...\n');
  execSync('npm run build', { stdio: 'inherit' });

  const distDir  = path.join(appRoot, 'dist');
  const assetsDir = path.join(distDir, 'assets');

  const jsFiles  = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js') && !f.endsWith('.map'));
  const cssFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.css'));

  const stableJsFile  = `${machineName}.js`;
  const stableCssFile = `${machineName}.css`;

  fs.renameSync(path.join(assetsDir, jsFiles[0]), path.join(assetsDir, stableJsFile));
  if (cssFiles.length > 0) {
    fs.renameSync(path.join(assetsDir, cssFiles[0]), path.join(assetsDir, stableCssFile));
  }

  // ---------------------------------------------------------
  // Create module directory and copy assets
  // ---------------------------------------------------------
  fs.mkdirSync(moduleDir);

  const moduleAssetsDir = path.join(moduleDir, 'dist', 'assets');
  fs.mkdirSync(moduleAssetsDir, { recursive: true });
  copyRecursive(assetsDir, moduleAssetsDir);

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
description: '3PD IDE React application module for ${displayName}.'
core_version_requirement: ^10 || ^11
package: 3PD IDE Apps
configure: ${machineName}.test_page
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
  const schemaFields = seedData.columns.length > 0
    ? buildDrupalSchemaPhp(seedData.columns)
    : `        'id' => [
          'type' => 'serial',
          'unsigned' => TRUE,
          'not null' => TRUE,
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

  const primaryKeyCol = seedData.columns.find((c) => c.pk === 1);
  const primaryKeyPhp = primaryKeyCol
    ? `'primary key' => ['${primaryKeyCol.name}'],`
    : `'primary key' => ['id'],`;

  const seedRows = seedData.rows.map((row) => {
    const fields = Object.entries(row)
      .filter(([k]) => k !== 'id')
      .map(([k, v]) => `        '${k}' => ${v === null ? 'NULL' : `'${String(v).replace(/'/g, "\\'")}'`}`)
      .join(',\n');
    return `      [\n${fields},\n      ]`;
  }).join(',\n');

  const installPhp = `<?php

/**
 * Implements hook_schema().
 */
function ${machineName}_schema() {
  $schema['${drupalTableName}'] = [
    'description' => 'Submissions table for the ${displayName} React app.',
    'fields' => [
${schemaFields}
    ],
    ${primaryKeyPhp}
  ];
  return $schema;
}

/**
 * Implements hook_install().
 */
function ${machineName}_install() {
  _${machineName}_import_seed();
}

/**
 * Import seed data from data/seed.json into the Drupal submissions table.
 * Called on install and by post_deploy.php on every Pantheon push.
 */
function _${machineName}_import_seed() {
  $seed_path = \\Drupal::service('extension.list.module')->getPath('${machineName}') . '/data/seed.json';
  if (!file_exists($seed_path)) {
    return;
  }

  $seed = json_decode(file_get_contents($seed_path), TRUE);
  if (empty($seed['rows'])) {
    return;
  }

  $db = \\Drupal::database();
  $db->truncate('${drupalTableName}')->execute();

  foreach ($seed['rows'] as $row) {
    unset($row['id']);
    $db->insert('${drupalTableName}')->fields($row)->execute();
  }
}
`;

  fs.writeFileSync(path.join(moduleDir, `${machineName}.install`), installPhp);

  // ---------------------------------------------------------
  // Write .libraries.yml
  // ---------------------------------------------------------
  const buildVersion = Date.now();

  const cssEntry = cssFiles.length > 0
    ? `  css:\n    theme:\n      dist/assets/${stableCssFile}: {}\n`
    : '';

  const librariesYml = `
${machineName}:
  version: ${buildVersion}
  js:
    dist/assets/${stableJsFile}:
      header: true
      attributes:
        type: module
${cssEntry}  dependencies:
    - core/drupal
`.trim() + '\n';

  fs.writeFileSync(path.join(moduleDir, `${machineName}.libraries.yml`), librariesYml);

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
  // Twig template — React always uses a mount div
  // ---------------------------------------------------------
  const templatesDir = path.join(moduleDir, 'templates');
  fs.mkdirSync(templatesDir);
  fs.writeFileSync(path.join(templatesDir, twigFilename), `<div id="${mountId}"></div>\n`);

  // ---------------------------------------------------------
  // Controllers — SubmissionsController + HudxTestController
  // ---------------------------------------------------------
  const controllerDir = path.join(moduleDir, 'src', 'Controller');
  fs.mkdirSync(controllerDir, { recursive: true });

  const submissionsControllerPhp = `<?php

namespace Drupal\\${machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;
use Symfony\\Component\\HttpFoundation\\JsonResponse;
use Symfony\\Component\\HttpFoundation\\Request;

/**
 * REST-like API for submissions — mirrors the local Express server.
 *
 * GET  /api/${appName}/submissions  — returns all rows, newest first.
 * POST /api/${appName}/submissions  — inserts a new row.
 *
 * Generated by 3PD module generator — do not edit manually.
 */
class SubmissionsController extends ControllerBase {

  public function list(): JsonResponse {
    $rows = \\Drupal::database()
      ->select('${drupalTableName}', 's')
      ->fields('s')
      ->orderBy('s.id', 'DESC')
      ->execute()
      ->fetchAll(\\PDO::FETCH_ASSOC);

    return new JsonResponse(array_values($rows));
  }

  public function submit(Request $request): JsonResponse {
    $data = json_decode($request->getContent(), TRUE);

    if (empty($data['message'])) {
      return new JsonResponse(['error' => 'message is required.'], 400);
    }

    \\Drupal::database()
      ->insert('${drupalTableName}')
      ->fields([
        'message'    => $data['message'],
        'created_at' => date('Y-m-d H:i:s'),
      ])
      ->execute();

    return new JsonResponse(['status' => 'ok'], 201);
  }

}
`;

  fs.writeFileSync(path.join(controllerDir, 'SubmissionsController.php'), submissionsControllerPhp);

  const testControllerPhp = `<?php

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
`;

  fs.writeFileSync(path.join(controllerDir, 'HudxTestController.php'), testControllerPhp.trim() + '\n');

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
  path: '/api/${appName}/submissions'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\SubmissionsController::list'
    _title: 'Submissions'
  requirements:
    _permission: 'access content'
  methods: [GET]

${machineName}.api_submissions_create:
  path: '/api/${appName}/submissions'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\SubmissionsController::submit'
    _title: 'Submit'
  requirements:
    _permission: 'access content'
  methods: [POST]
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

  const drupalModuleDir = path.join(drupalWebRoot, 'modules', 'custom', machineName);

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
