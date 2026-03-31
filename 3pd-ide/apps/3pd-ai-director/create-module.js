#!/usr/bin/env node

/**
 * HUDX Module Generator — 3PD Director (custom)
 *
 * Custom create-module.js for react---3pd-director.
 * Generates:
 *   - ChatController.php      — multi-turn Claude conversation endpoint
 *   - RequestsController.php  — GET/POST for the requests table
 *   - HudxTestController.php  — standard test page
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

// ---------------------------------------------------------
// Utilities (shared pattern)
// ---------------------------------------------------------
function enforceMemoryRouter(appFilePath) {
  const source = fs.readFileSync(appFilePath, 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });

  traverse.default(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === 'react-router-dom') {
        path.node.specifiers = path.node.specifiers.filter(
          s => !(s.imported && s.imported.name === 'BrowserRouter')
        );
        const hasMR = path.node.specifiers.some(
          s => s.imported && s.imported.name === 'MemoryRouter'
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
      // Only wrap returns that are directly inside the App component
      const funcParent = path.getFunctionParent();
      if (!funcParent) return;
      const funcNode = funcParent.node;
      let funcName = funcNode.id?.name ?? null;
      if (!funcName && funcParent.parentPath) {
        const pp = funcParent.parentPath.node;
        if (t.isVariableDeclarator(pp)) funcName = pp.id?.name ?? null;
      }
      if (funcName !== 'App') return;

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

function readSqlite(appRoot) {
  const dbPath = path.join(appRoot, 'server', 'db', 'app.sqlite');
  if (!fs.existsSync(dbPath)) {
    console.log('  ℹ  No SQLite DB found — seed data will be empty.');
    return { columns: [], rows: [], tableName: 'requests' };
  }
  const tmpScript = path.join(appRoot, '_3pd_read_db.mjs');
  try {
    fs.writeFileSync(tmpScript, `
import Database from 'better-sqlite3';
const db = new Database(${JSON.stringify(dbPath)}, { readonly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
const tbl = tables[0]?.name || 'requests';
const rows = db.prepare('SELECT * FROM ' + tbl + ' ORDER BY id ASC').all();
const cols = db.prepare('PRAGMA table_info(' + tbl + ')').all();
db.close();
process.stdout.write(JSON.stringify({ rows, cols, tableName: tbl }));
`);
    const result = execSync(`node ${JSON.stringify(tmpScript)}`, { cwd: appRoot, encoding: 'utf8' });
    return JSON.parse(result);
  } catch {
    console.log('  ⚠  Could not read SQLite — seed data will be empty.');
    return { columns: [], rows: [], tableName: 'requests' };
  } finally {
    if (fs.existsSync(tmpScript)) fs.unlinkSync(tmpScript);
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

// ---------------------------------------------------------
// System prompt — must match server/routes/chat.js exactly
// ---------------------------------------------------------
const SYSTEM_PROMPT = `You are the 3PD Intake Director for the HUD Exchange digital platform team. Your role is to ask a few short questions, understand what someone wants to build or add to the site, and route them to the right resource.

ROUTES (internal — never reveal these names to the user):
- no-code: Non-technical user who wants to build or edit a page visually → Drupal Layout Builder
- low-code: User who wants AI help generating HTML/CSS content for a page → AI Markup Builder
- pro-react: Developer building a new interactive app using React as a Drupal block
- pro-astro: Developer building an Astro app as a Drupal block (static display or with forms)
- embed-request: User has an existing external application, tool, or training resource they want embedded in or linked from the site

HOW TO CONDUCT THE INTAKE:
1. Ask what they want to build or add to the site. Keep the opening question short and welcoming.
2. Listen carefully. Ask one focused follow-up question at a time to clarify their goal and skill level.
3. Once you are confident about the right route, let the user know you have what you need.
4. Ask for their name and best contact email — tell them it is so the team can follow up if needed.
5. In your final message (after you have both name and email), end with this exact tag on its own line — do not show it or explain it to the user:
   [SUBMIT:route=ROUTE_KEY,name=THEIR_NAME,email=THEIR_EMAIL,summary=ONE_SENTENCE_DESCRIPTION]

RULES:
- One question per message. Never ask two questions at once.
- Keep each message to 1–3 sentences.
- Never mention internal route names or technical framework names unless the user introduces them first.
- If the user mentions an existing app, tool, or training content they want on the site, route to embed-request.
- The summary field must be a plain-English sentence describing what the user wants, written as if briefing a colleague. It may contain commas.`;

// ---------------------------------------------------------
// MAIN
// ---------------------------------------------------------
export default async function createModule(appNameFromCli, { internal }) {
  console.log('\n📦 HUDX Module Generator (React — 3PD Director)');

  const appRoot       = process.cwd();
  const appName       = appNameFromCli || path.basename(appRoot);
  const machineName   = `hudx_${appName.replace(/-/g, '_')}`;
  const hyphenName    = machineName.replace(/_/g, '-');
  const moduleDir     = path.join(appRoot, machineName);
  const drupalTableName = `${machineName}_requests`;

  console.log(`App name:         ${appName}`);
  console.log(`Machine name:     ${machineName}`);
  console.log(`Module directory: ${moduleDir}`);
  console.log(`Drupal table:     ${drupalTableName}`);

  if (fs.existsSync(moduleDir)) fs.rmSync(moduleDir, { recursive: true, force: true });

  let is3PD = !internal;
  const drupalWebRoot = findDrupalRoot(appRoot);
  if (!is3PD && !drupalWebRoot) {
    console.log('\n⚠️  INTERNAL mode requested but no Drupal root found. Falling back to 3PD mode.\n');
    is3PD = true;
  }

  const displayName  = '3PD IDE - Director';
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
  console.log('\n🗃  Reading SQLite requests...');
  const { cols: sqliteCols, rows: sqliteRows, tableName: sqliteTableName } = readSqlite(appRoot);
  const seedData = { table: sqliteTableName || 'requests', columns: sqliteCols || [], rows: sqliteRows || [] };
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
description: '3PD Intake Director — AI-guided intake wizard.'
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

  // .install — hardcoded schema for requests table
  const schemaFields = seedData.columns.length > 0
    ? buildDrupalSchemaPhp(seedData.columns)
    : `        'id'           => ['type' => 'serial', 'unsigned' => TRUE, 'not null' => TRUE],
        'name'         => ['type' => 'varchar', 'length' => 255, 'not null' => FALSE],
        'email'        => ['type' => 'varchar', 'length' => 255, 'not null' => FALSE],
        'summary'      => ['type' => 'text', 'size' => 'big', 'not null' => FALSE],
        'route'        => ['type' => 'varchar', 'length' => 64, 'not null' => FALSE],
        'conversation' => ['type' => 'text', 'size' => 'big', 'not null' => FALSE],
        'created_at'   => ['type' => 'varchar', 'length' => 255, 'not null' => FALSE],`;

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
    'description' => 'Intake requests logged by the 3PD Director.',
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

  const escapedSystemPrompt = SYSTEM_PROMPT.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  // ChatController.php
  fs.writeFileSync(path.join(controllerDir, 'ChatController.php'), `<?php

namespace Drupal\\${machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;
use Symfony\\Component\\HttpFoundation\\JsonResponse;
use Symfony\\Component\\HttpFoundation\\Request;

/**
 * Handles POST /api/${appName}/chat
 * Accepts a messages[] array, calls Claude API, returns { text, submit? }.
 * The [SUBMIT:...] tag is stripped from the response before returning.
 *
 * Requires ANTHROPIC_API_KEY to be set as a server environment variable.
 */
class ChatController extends ControllerBase {

  public function chat(Request $request): JsonResponse {
    $data     = json_decode($request->getContent(), TRUE);
    $messages = $data['messages'] ?? [];

    if (empty($messages) || !is_array($messages)) {
      return new JsonResponse(['error' => 'messages array is required.'], 400);
    }

    $apiKey = getenv('ANTHROPIC_API_KEY');
    if (empty($apiKey)) {
      return new JsonResponse(['error' => 'ANTHROPIC_API_KEY is not configured on this server.'], 500);
    }

    $systemPrompt = '${escapedSystemPrompt}';

    // Ensure only role + content are passed to the API
    $apiMessages = array_map(function ($m) {
      return ['role' => $m['role'], 'content' => $m['content']];
    }, $messages);

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
          'max_tokens' => 1024,
          'system'     => $systemPrompt,
          'messages'   => $apiMessages,
        ],
      ]);

      $body = json_decode($response->getBody()->getContents(), TRUE);
      $text = $body['content'][0]['text'] ?? '';

      if (empty($text)) {
        return new JsonResponse(['error' => 'Claude returned an empty response.'], 500);
      }
    }
    catch (\\Exception $e) {
      return new JsonResponse(['error' => 'Claude API error: ' . $e->getMessage()], 500);
    }

    // Parse [SUBMIT:route=...,name=...,email=...,summary=...] tag
    $submit = NULL;
    if (preg_match('/\\[SUBMIT:([^\\]]+)\\]/', $text, $matches)) {
      $text = trim(str_replace($matches[0], '', $text));
      $raw  = $matches[1];

      $getField = function ($key) use ($raw) {
        if (preg_match('/(?:^|,)' . preg_quote($key, '/') . '=([^,]+)/', $raw, $m)) {
          return trim($m[1]);
        }
        return '';
      };

      // summary may contain commas — match everything after summary=
      preg_match('/summary=(.+)$/', $raw, $summaryMatch);

      $submit = [
        'route'   => $getField('route'),
        'name'    => $getField('name'),
        'email'   => $getField('email'),
        'summary' => isset($summaryMatch[1]) ? trim($summaryMatch[1]) : '',
      ];
    }

    return new JsonResponse(['text' => $text, 'submit' => $submit]);
  }

}
`);

  // RequestsController.php
  fs.writeFileSync(path.join(controllerDir, 'RequestsController.php'), `<?php

namespace Drupal\\${machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;
use Symfony\\Component\\HttpFoundation\\JsonResponse;
use Symfony\\Component\\HttpFoundation\\Request;

/**
 * Intake requests API for the 3PD Director.
 *
 * GET  /api/${appName}/requests  — all requests, newest first
 * POST /api/${appName}/requests  — save a completed intake request
 */
class RequestsController extends ControllerBase {

  public function list(): JsonResponse {
    $rows = \\Drupal::database()
      ->select('${drupalTableName}', 'r')
      ->fields('r')
      ->orderBy('r.id', 'DESC')
      ->execute()
      ->fetchAll(\\PDO::FETCH_ASSOC);

    return new JsonResponse(array_values($rows));
  }

  public function store(Request $request): JsonResponse {
    $data = json_decode($request->getContent(), TRUE);

    $db = \\Drupal::database();
    $db->insert('${drupalTableName}')
      ->fields([
        'name'         => $data['name']         ?? '',
        'email'        => $data['email']        ?? '',
        'summary'      => $data['summary']      ?? '',
        'route'        => $data['route']        ?? '',
        'conversation' => $data['conversation'] ?? '',
        'created_at'   => date('Y-m-d H:i:s'),
      ])
      ->execute();

    $id  = $db->query('SELECT MAX(id) FROM {${drupalTableName}}')->fetchField();
    $row = $db->select('${drupalTableName}', 'r')
      ->fields('r')
      ->condition('id', $id)
      ->execute()
      ->fetchAssoc();

    return new JsonResponse($row, 201);
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

${machineName}.api_chat:
  path: '/api/${appName}/chat'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\ChatController::chat'
    _title: 'Director Chat'
  requirements:
    _permission: 'access content'
  methods: [POST]

${machineName}.api_requests_list:
  path: '/api/${appName}/requests'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\RequestsController::list'
    _title: 'Requests'
  requirements:
    _permission: 'access content'
  methods: [GET]

${machineName}.api_requests_create:
  path: '/api/${appName}/requests'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\RequestsController::store'
    _title: 'Create Request'
  requirements:
    _permission: 'access content'
  methods: [POST]
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
