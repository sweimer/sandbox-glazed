#!/usr/bin/env node

/**
 * HUDX Module Generator — 3PD AI Helper (custom)
 *
 * Custom create-module.js for react---3pd-ai-helper.
 * Replaces the generic SubmissionsController with:
 *   - GenerateController.php  — calls Anthropic API via Drupal HTTP client
 *   - HistoryController.php   — GET /history, PATCH /history/{id}, DELETE /history/{id}
 *
 * API key: set ANTHROPIC_API_KEY as a Pantheon environment variable.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

// ---------------------------------------------------------
// AST-SAFE MemoryRouter enforcement (shared with starter)
// ---------------------------------------------------------
function enforceMemoryRouter(appFilePath) {
  const source = fs.readFileSync(appFilePath, 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });

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
            t.importSpecifier(t.identifier('MemoryRouter'), t.identifier('MemoryRouter'))
          );
        }
      }
    },
    JSXElement(path) {
      const openingName = path.node.openingElement.name;
      if (t.isJSXIdentifier(openingName) && openingName.name === 'BrowserRouter') {
        const children = path.node.children || [];
        path.replaceWith(children.length === 1 ? children[0] : children);
      }
    },
    ReturnStatement(path) {
      const argument = path.node.argument;
      if (!argument) return;
      if (
        t.isJSXElement(argument) &&
        t.isJSXIdentifier(argument.openingElement.name) &&
        argument.openingElement.name.name === 'MemoryRouter'
      ) return;
      path.node.argument = t.jsxElement(
        t.jsxOpeningElement(t.jsxIdentifier('MemoryRouter'), []),
        t.jsxClosingElement(t.jsxIdentifier('MemoryRouter')),
        [argument],
        false
      );
    },
  });

  fs.writeFileSync(appFilePath, generate.default(ast, { retainLines: true }).code, 'utf8');
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    entry.isDirectory() ? copyRecursive(s, d) : fs.copyFileSync(s, d);
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

function buildDrupalSchemaPhp(columns) {
  return columns.map((col) => {
    const type = (col.type || '').toUpperCase();
    let lines = `        '${col.name}' => [\n`;
    if (col.pk === 1) {
      lines += `          'type' => 'serial',\n          'unsigned' => TRUE,\n          'not null' => TRUE,\n`;
    } else if (type === 'INTEGER' || type === 'INT') {
      lines += `          'type' => 'int',\n          'not null' => FALSE,\n`;
    } else if (type === 'TEXT' || type === 'BLOB' || type === '') {
      lines += `          'type' => 'text',\n          'size' => 'big',\n          'not null' => FALSE,\n`;
    } else {
      lines += `          'type' => 'varchar',\n          'length' => 255,\n          'not null' => FALSE,\n`;
    }
    lines += `        ],`;
    return lines;
  }).join('\n');
}

function readSqlite(appRoot) {
  const dbPath = path.join(appRoot, 'server', 'db', 'app.sqlite');
  if (!fs.existsSync(dbPath)) {
    console.log('  ℹ  No SQLite DB found — seed data will be empty.');
    return { columns: [], rows: [], tableName: 'history' };
  }
  const tmpScript = path.join(appRoot, '_3pd_read_db.mjs');
  try {
    fs.writeFileSync(tmpScript, `
import Database from 'better-sqlite3';
const db = new Database(${JSON.stringify(dbPath)}, { readonly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
const tbl = tables[0]?.name || 'history';
const rows = db.prepare('SELECT * FROM ' + tbl + ' ORDER BY id ASC').all();
const cols = db.prepare('PRAGMA table_info(' + tbl + ')').all();
db.close();
process.stdout.write(JSON.stringify({ rows, cols, tableName: tbl }));
`);
    const result = execSync(`node ${JSON.stringify(tmpScript)}`, { cwd: appRoot, encoding: 'utf8' });
    return JSON.parse(result);
  } catch {
    console.log('  ⚠  Could not read SQLite — seed data will be empty.');
    return { columns: [], rows: [], tableName: 'history' };
  } finally {
    if (fs.existsSync(tmpScript)) fs.unlinkSync(tmpScript);
  }
}

// ---------------------------------------------------------
// System prompt for Claude (must match server/routes/generate.js)
// ---------------------------------------------------------
const CLAUDE_SYSTEM_PROMPT = `You are a markup generator for a Drupal CMS. Your only job is to produce clean, accessible HTML and CSS markup.

Rules you must follow without exception:
- Return ONLY raw HTML/CSS. Nothing else.
- No backticks. No markdown. No code fences.
- No explanations. No commentary. No preamble. No closing remarks.
- Do not say "here is the markup" or anything similar.
- Your entire response must be valid HTML that can be pasted directly into a Drupal Full HTML body field and render correctly.

Markup standards:
- Use semantic HTML elements
- Use proper form accessibility: <label for="">, <fieldset>, <legend>
- Use correct heading hierarchy (never skip levels)
- Use ARIA attributes only when native HTML semantics are insufficient
- Write clean, well-indented markup

Styling:
- Use a <style> block at the top of your output for any CSS
- Keep styles minimal and purposeful
- No external frameworks, no CDN links, no external dependencies
- Styles should be scoped to avoid conflicts when embedded in Drupal

Consistency:
- Predictable, repeatable structure
- Clean indentation (2 spaces)
- No random variations between requests`;

// ---------------------------------------------------------
// MAIN
// ---------------------------------------------------------
export default async function createModule(appNameFromCli, { internal }) {
  console.log('\n📦 HUDX Module Generator (React — AI Helper)');

  const appRoot  = process.cwd();
  const appName  = appNameFromCli || path.basename(appRoot);
  const machineName   = `hudx_${appName.replace(/-/g, '_')}`;
  const hyphenName    = machineName.replace(/_/g, '-');
  const moduleDir     = path.join(appRoot, machineName);
  const drupalTableName = `${machineName}_history`;

  console.log(`App name: ${appName}`);
  console.log(`Machine name:     ${machineName}`);
  console.log(`Hyphen name:      ${hyphenName}`);
  console.log(`Module directory: ${moduleDir}`);

  if (fs.existsSync(moduleDir)) fs.rmSync(moduleDir, { recursive: true, force: true });

  let is3PD = !internal;
  const drupalWebRoot = findDrupalRoot(appRoot);
  if (!is3PD && !drupalWebRoot) {
    console.log('\n⚠️  INTERNAL mode requested but no Drupal root found. Falling back to 3PD mode.\n');
    is3PD = true;
  }

  const displayName  = `3PD IDE - AI Helper`;
  const themeHookKey = `${machineName}_block`;
  const templateName = `${hyphenName}-block`;
  const twigFilename = `${templateName}.html.twig`;
  const mountId      = `${hyphenName}-root`;
  const behaviorName = machineName.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') + 'Behavior';

  // Rewrite main.jsx
  const entryContent = `
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

function mountHudxReactApp(context = document) {
  const el = context.getElementById
    ? context.getElementById("${mountId}")
    : document.getElementById("${mountId}");
  if (!el) return;
  if (!el.__hudxReactRoot) el.__hudxReactRoot = ReactDOM.createRoot(el);
  el.__hudxReactRoot.render(<React.StrictMode><App /></React.StrictMode>);
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
      attach(context) { mountHudxReactApp(context); },
    };
  })(window.Drupal);
}
`.trim() + '\n';

  fs.writeFileSync(path.join(appRoot, 'src', 'main.jsx'), entryContent, 'utf8');
  console.log('🛠  Updated main.jsx');

  enforceMemoryRouter(path.join(appRoot, 'src', 'App.jsx'));
  console.log('✔  MemoryRouter enforced');

  const indexHtmlPath = path.join(appRoot, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    let html = fs.readFileSync(indexHtmlPath, 'utf8');
    html = html.replace(/<div id="root"><\/div>/g, `<div id="${mountId}"></div>`);
    fs.writeFileSync(indexHtmlPath, html, 'utf8');
    console.log('🛠  Updated index.html');
  }

  // Read SQLite
  console.log('\n🗃  Reading SQLite history...');
  const { cols: sqliteCols, rows: sqliteRows, tableName: sqliteTableName } = readSqlite(appRoot);
  const seedData = { table: sqliteTableName || 'history', columns: sqliteCols || [], rows: sqliteRows || [] };
  console.log(`  ✔  ${seedData.rows.length} row(s) found.`);

  // Build
  console.log('\n⚛️  Building React app...\n');
  execSync('npm run build', { stdio: 'inherit' });

  const distDir   = path.join(appRoot, 'dist');
  const assetsDir = path.join(distDir, 'assets');
  const jsFiles   = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js') && !f.endsWith('.map'));
  const cssFiles  = fs.readdirSync(assetsDir).filter(f => f.endsWith('.css'));
  const stableJs  = `${machineName}.js`;
  const stableCss = `${machineName}.css`;

  fs.renameSync(path.join(assetsDir, jsFiles[0]), path.join(assetsDir, stableJs));
  if (cssFiles.length > 0) fs.renameSync(path.join(assetsDir, cssFiles[0]), path.join(assetsDir, stableCss));

  // Module directory + assets
  fs.mkdirSync(moduleDir);
  const moduleAssetsDir = path.join(moduleDir, 'dist', 'assets');
  fs.mkdirSync(moduleAssetsDir, { recursive: true });
  copyRecursive(assetsDir, moduleAssetsDir);

  // seed.json
  const dataDir = path.join(moduleDir, 'data');
  fs.mkdirSync(dataDir);
  fs.writeFileSync(path.join(dataDir, 'seed.json'), JSON.stringify(seedData, null, 2) + '\n');

  // .info.yml
  fs.writeFileSync(path.join(moduleDir, `${machineName}.info.yml`), `
name: ${displayName}
type: module
description: '3PD AI Helper — Claude-powered markup generator.'
core_version_requirement: ^10 || ^11
package: 3PD IDE Apps
configure: ${machineName}.test_page
`.trim() + '\n');

  // .module
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
`.trim() + '\n');

  // .install
  const schemaFields = seedData.columns.length > 0
    ? buildDrupalSchemaPhp(seedData.columns)
    : `        'id' => ['type' => 'serial', 'unsigned' => TRUE, 'not null' => TRUE],
        'title' => ['type' => 'varchar', 'length' => 255, 'not null' => FALSE],
        'prompt' => ['type' => 'text', 'size' => 'big', 'not null' => FALSE],
        'markup' => ['type' => 'text', 'size' => 'big', 'not null' => FALSE],
        'node_url' => ['type' => 'varchar', 'length' => 255, 'not null' => FALSE],
        'created_at' => ['type' => 'varchar', 'length' => 255, 'not null' => FALSE],`;

  const pkCol = seedData.columns.find(c => c.pk === 1);
  const primaryKeyPhp = `'primary key' => ['${pkCol ? pkCol.name : 'id'}'],`;

  const seedRows = seedData.rows.map(row => {
    const fields = Object.entries(row)
      .filter(([k]) => k !== 'id')
      .map(([k, v]) => `        '${k}' => ${v === null ? 'NULL' : `'${String(v).replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`}`)
      .join(',\n');
    return `      [\n${fields},\n      ]`;
  }).join(',\n');

  fs.writeFileSync(path.join(moduleDir, `${machineName}.install`), `<?php

/**
 * Implements hook_schema().
 */
function ${machineName}_schema() {
  $schema['${drupalTableName}'] = [
    'description' => 'AI markup generation history for the 3PD AI Helper.',
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

function _${machineName}_import_seed() {
  $seed_path = \\Drupal::service('extension.list.module')->getPath('${machineName}') . '/data/seed.json';
  if (!file_exists($seed_path)) return;
  $seed = json_decode(file_get_contents($seed_path), TRUE);
  if (empty($seed['rows'])) return;
  $db = \\Drupal::database();
  $db->truncate('${drupalTableName}')->execute();
  foreach ($seed['rows'] as $row) {
    unset($row['id']);
    $db->insert('${drupalTableName}')->fields($row)->execute();
  }
}
`);

  // .libraries.yml
  const cssEntry = cssFiles.length > 0 ? `  css:\n    theme:\n      dist/assets/${stableCss}: {}\n` : '';
  fs.writeFileSync(path.join(moduleDir, `${machineName}.libraries.yml`), `
${machineName}:
  version: ${Date.now()}
  js:
    dist/assets/${stableJs}:
      header: true
      attributes:
        type: module
${cssEntry}  dependencies:
    - core/drupal
`.trim() + '\n');

  // Block plugin
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
      '#theme' => '${themeHookKey}',
      '#attached' => ['library' => ['${machineName}/${machineName}']],
    ];
  }
}
`.trim() + '\n');

  // Twig template
  const templatesDir = path.join(moduleDir, 'templates');
  fs.mkdirSync(templatesDir);
  fs.writeFileSync(path.join(templatesDir, twigFilename), `<div id="${mountId}"></div>\n`);

  // Controllers
  const controllerDir = path.join(moduleDir, 'src', 'Controller');
  fs.mkdirSync(controllerDir, { recursive: true });

  // Escape system prompt for PHP single-quoted string
  const escapedSystemPrompt = CLAUDE_SYSTEM_PROMPT.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  // GenerateController.php
  fs.writeFileSync(path.join(controllerDir, 'GenerateController.php'), `<?php

namespace Drupal\\${machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;
use Symfony\\Component\\HttpFoundation\\JsonResponse;
use Symfony\\Component\\HttpFoundation\\Request;

/**
 * Handles POST /api/${appName}/generate
 * Calls the Anthropic API and saves result to the history table.
 *
 * Requires ANTHROPIC_API_KEY to be set as a server environment variable.
 */
class GenerateController extends ControllerBase {

  public function generate(Request $request): JsonResponse {
    $data   = json_decode($request->getContent(), TRUE);
    $prompt = trim($data['prompt'] ?? '');
    $title  = trim($data['title']  ?? '');

    if (empty($prompt)) {
      return new JsonResponse(['error' => 'prompt is required.'], 400);
    }

    $apiKey = getenv('ANTHROPIC_API_KEY');
    if (empty($apiKey)) {
      return new JsonResponse(['error' => 'ANTHROPIC_API_KEY is not configured on this server.'], 500);
    }

    $systemPrompt = '${escapedSystemPrompt}';

    try {
      $client   = \\Drupal::httpClient();
      $response = $client->post('https://api.anthropic.com/v1/messages', [
        'headers' => [
          'x-api-key'         => $apiKey,
          'anthropic-version' => '2023-06-01',
          'content-type'      => 'application/json',
        ],
        'json' => [
          'model'      => 'claude-haiku-4-5-20251001',
          'max_tokens' => 4096,
          'system'     => $systemPrompt,
          'messages'   => [['role' => 'user', 'content' => $prompt]],
        ],
      ]);

      $body   = json_decode($response->getBody()->getContents(), TRUE);
      $markup = $body['content'][0]['text'] ?? '';

      if (empty($markup)) {
        return new JsonResponse(['error' => 'Claude returned an empty response.'], 500);
      }
    }
    catch (\\Exception $e) {
      return new JsonResponse(['error' => 'Claude API error: ' . $e->getMessage()], 500);
    }

    $db = \\Drupal::database();
    $db->insert('${drupalTableName}')
      ->fields([
        'title'      => $title ?: NULL,
        'prompt'     => $prompt,
        'markup'     => $markup,
        'created_at' => date('Y-m-d H:i:s'),
      ])
      ->execute();

    $id  = $db->query('SELECT MAX(id) FROM {${drupalTableName}}')->fetchField();
    $row = $db->select('${drupalTableName}', 'h')
      ->fields('h')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return new JsonResponse($row, 201);
  }

}
`);

  // HistoryController.php
  fs.writeFileSync(path.join(controllerDir, 'HistoryController.php'), `<?php

namespace Drupal\\${machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;
use Symfony\\Component\\HttpFoundation\\JsonResponse;
use Symfony\\Component\\HttpFoundation\\Request;
use Symfony\\Component\\HttpFoundation\\Response;

/**
 * History API for the 3PD AI Helper.
 *
 * GET    /api/${appName}/history         — all rows newest first
 * PATCH  /api/${appName}/history/{id}    — update node_url
 * DELETE /api/${appName}/history/{id}    — delete a row
 */
class HistoryController extends ControllerBase {

  public function list(): JsonResponse {
    $rows = \\Drupal::database()
      ->select('${drupalTableName}', 'h')
      ->fields('h')
      ->orderBy('h.id', 'DESC')
      ->execute()
      ->fetchAll(\\PDO::FETCH_ASSOC);

    return new JsonResponse(array_values($rows));
  }

  public function update(Request $request, $id): JsonResponse {
    $data     = json_decode($request->getContent(), TRUE);
    $node_url = trim($data['node_url'] ?? '');

    if (empty($node_url)) {
      return new JsonResponse(['error' => 'node_url is required.'], 400);
    }

    \\Drupal::database()
      ->update('${drupalTableName}')
      ->fields(['node_url' => $node_url])
      ->condition('id', $id)
      ->execute();

    $row = \\Drupal::database()
      ->select('${drupalTableName}', 'h')
      ->fields('h')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return new JsonResponse($row ?: ['error' => 'Not found.'], $row ? 200 : 404);
  }

  public function delete($id): Response {
    \\Drupal::database()
      ->delete('${drupalTableName}')
      ->condition('id', $id)
      ->execute();

    return new Response('', 204);
  }

}
`);

  // HudxTestController.php
  fs.writeFileSync(path.join(controllerDir, 'HudxTestController.php'), `<?php

namespace Drupal\\${machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;

class HudxTestController extends ControllerBase {
  public function page() {
    return [
      '#theme' => '${themeHookKey}',
      '#attached' => ['library' => ['${machineName}/${machineName}']],
    ];
  }
}
`.trim() + '\n');

  // .routing.yml
  fs.writeFileSync(path.join(moduleDir, `${machineName}.routing.yml`), `
${machineName}.test_page:
  path: '/hudx-test/${appName}'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\HudxTestController::page'
    _title: 'HUDX Test: ${appName}'
  requirements:
    _permission: 'access content'

${machineName}.api_generate:
  path: '/api/${appName}/generate'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\GenerateController::generate'
    _title: 'Generate Markup'
  requirements:
    _permission: 'access content'
  methods: [POST]

${machineName}.api_history_list:
  path: '/api/${appName}/history'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\HistoryController::list'
    _title: 'History'
  requirements:
    _permission: 'access content'
  methods: [GET]

${machineName}.api_history_update:
  path: '/api/${appName}/history/{id}'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\HistoryController::update'
    _title: 'Update History'
  requirements:
    _permission: 'access content'
    id: '\\d+'
  methods: [PATCH]

${machineName}.api_history_delete:
  path: '/api/${appName}/history/{id}'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\HistoryController::delete'
    _title: 'Delete History'
  requirements:
    _permission: 'access content'
    id: '\\d+'
  methods: [DELETE]
`.trim() + '\n');

  if (is3PD) {
    console.log('\n🎉 HUDX Drupal module created successfully!');
    console.log(`📍 Location: ${moduleDir}`);
    console.log(`🔗 Test route will be available at: /hudx-test/${appName}\n`);
    return;
  }

  // INTERNAL MODE
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
  if (!enabled) console.log(`  ⚠  Could not enable automatically. Run: lando drush en ${machineName} -y`);

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
  console.log(`📍 Module: ${drupalModuleDir}`);
  console.log(`🔗 Test page: ${testUrl}\n`);
  console.log('⚠️  Remember: set ANTHROPIC_API_KEY as an environment variable on Pantheon.\n');
}
