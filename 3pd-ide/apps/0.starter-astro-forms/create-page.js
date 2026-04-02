#!/usr/bin/env node

/**
 * HUDX Page Generator — Astro
 * Builds the Astro app and packages it as a full-page Drupal module.
 *
 * Unlike the block generator (create-module.js), the page generator:
 *   - Creates a real Drupal route that owns a full page URL
 *   - Strips all Drupal regions via a page-level twig template suggestion
 *   - Does NOT generate a Block plugin (no Layout Builder placement needed)
 *
 * The result is an Astro app that lives at /<appName> as a standalone Drupal page.
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
  } catch (e) {
    console.log('  ⚠  Could not read SQLite — seed data will be empty.');
    return { columns: [], rows: [], tableName: 'submissions' };
  } finally {
    if (fs.existsSync(tmpScript)) fs.unlinkSync(tmpScript);
  }
}

// ---------------------------------------------------------
// MAIN EXPORTED FUNCTION
// ---------------------------------------------------------
export default async function createPage(appNameFromCli, { internal }) {
  console.log('\n📦 HUDX Page Generator (Astro)');

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
    console.log(`
⚠️  INTERNAL mode requested but no Drupal root found.
Falling back to 3PD mode.
`);
    is3PD = true;
  }

  const humanName   = toHumanName(appName);
  const displayName = `3PD IDE - ${humanName}`;

  // Page mode theme/template names
  // Content template: {hyphenName}-page.html.twig  (body HTML from Astro build)
  // Page template:    page--{hyphenName}-page.html.twig  (strips all Drupal regions)
  const themeHookKey         = `${machineName}_page`;
  const contentTemplateName  = `${hyphenName}-page`;
  const contentTwigFilename  = `${contentTemplateName}.html.twig`;
  const pageTemplateName     = `page--${hyphenName}-page`;
  const pageTwigFilename     = `${pageTemplateName}.html.twig`;
  // Drupal theme hook suggestion key (underscores): page__<machineName>_page
  const pageThemeSuggestion  = `page__${machineName}_page`;

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

  // Read the full Astro build output — PageController serves it as a raw Response,
  // bypassing Drupal's theming layer entirely so no header/footer/nav appears.
  let inlineJs  = '';
  let inlineCss = '';
  let bodyHtml  = '';
  let pageHtml  = '';

  const distHtmlPath = path.join(distDir, 'index.html');
  if (fs.existsSync(distHtmlPath)) {
    const html = fs.readFileSync(distHtmlPath, 'utf8');
    pageHtml = html;

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
  const { cols: sqliteCols, rows: sqliteRows, tableName: sqliteTableName } = readSqlite(appRoot);
  const seedData = {
    table:   sqliteTableName || 'submissions',
    columns: sqliteCols || [],
    rows:    sqliteRows || [],
  };
  const tableName = `${machineName}_${seedData.table}`;
  console.log(`  ✔  ${seedData.rows.length} row(s) found.`);

  // ---------------------------------------------------------
  // Create module directory and copy assets
  // ---------------------------------------------------------
  fs.mkdirSync(moduleDir);

  const moduleAssetsDir = path.join(moduleDir, 'dist', 'assets');
  fs.mkdirSync(moduleAssetsDir, { recursive: true });

  if (fs.existsSync(astroAssets) && (jsFiles.length > 0 || cssFiles.length > 0)) {
    // Copy all external assets (JS and/or CSS) from _astro/ to the module.
    // Previously gated on jsFiles only — missed the CSS-only case (no external JS bundle).
    copyRecursive(astroAssets, moduleAssetsDir);
  } else {
    if (inlineJs)  fs.writeFileSync(path.join(moduleAssetsDir, stableJsFile), inlineJs);
    if (inlineCss) fs.writeFileSync(path.join(moduleAssetsDir, stableCssFile), inlineCss);
  }

  // ---------------------------------------------------------
  // HTML rewriting helper — rewrites /_astro/ paths to the module's
  // public path and injects Bootstrap CDN (unavailable when bypassing
  // Drupal's theming layer). Used for both the main page and sub-pages.
  // ---------------------------------------------------------
  const modulePublicPath = `/modules/custom/${machineName}/dist/assets`;
  const bootstrapHead = [
    '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css">',
    '  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.min.css">',
  ].join('\n');
  const bootstrapFoot = '  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>';

  function rewritePageHtml(html) {
    let out = html;
    if (jsFiles.length > 0) {
      out = out.split(`/_astro/${jsFiles[0]}`).join(`${modulePublicPath}/${stableJsFile}`);
    }
    if (cssFiles.length > 0) {
      out = out.split(`/_astro/${cssFiles[0]}`).join(`${modulePublicPath}/${stableCssFile}`);
    }
    out = out.replace(/\/_astro\//g, `${modulePublicPath}/`);
    out = out.replace('<head>', `<head>\n${bootstrapHead}`);
    out = out.replace('</body>', `${bootstrapFoot}\n</body>`);
    return out;
  }

  // Write dist/page.html — main page (index.html)
  if (pageHtml) {
    fs.writeFileSync(path.join(moduleDir, 'dist', 'page.html'), rewritePageHtml(pageHtml));
  }

  // ---------------------------------------------------------
  // Process sub-pages: any dist/{slug}/index.html becomes
  // dist/{slug}.html in the module and gets its own route + method.
  // ---------------------------------------------------------
  const additionalPages = [];
  const SKIP_DIRS = new Set(['api-reference', 'styleguide', '_astro', 'assets']);
  for (const entry of fs.readdirSync(distDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('_') || SKIP_DIRS.has(entry.name)) continue;
    const subHtmlPath = path.join(distDir, entry.name, 'index.html');
    if (!fs.existsSync(subHtmlPath)) continue;
    const subHtml = fs.readFileSync(subHtmlPath, 'utf8');
    fs.writeFileSync(path.join(moduleDir, 'dist', `${entry.name}.html`), rewritePageHtml(subHtml));
    additionalPages.push(entry.name);
    console.log(`  ✔  Sub-page bundled: /${appName}/${entry.name}`);
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
description: '3PD IDE Astro full-page application module for ${displayName}.'
core_version_requirement: ^10 || ^11
package: 3PD IDE Apps
configure: ${machineName}.page
`.trim() + '\n';

  fs.writeFileSync(path.join(moduleDir, `${machineName}.info.yml`), infoYml);

  // ---------------------------------------------------------
  // Write .module
  // hook_theme()              — registers the content template
  // hook_theme_suggestions_page_alter() — applies page template on this route
  //                             to strip all Drupal regions
  // ---------------------------------------------------------
  const modulePhp = `<?php

/**
 * @file
 * Module hooks for ${machineName}.
 *
 * The Astro app is served as a raw HTML response by PageController,
 * bypassing Drupal's theming layer so no site chrome appears.
 * Schema and seed data installation are handled in ${machineName}.install.
 *
 * Generated by 3PD module generator — do not edit manually.
 */
`;

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

  // No twig templates needed — PageController serves dist/page.html as a raw Response.

  // ---------------------------------------------------------
  // Page controller
  // Renders the Astro app at the page route.
  // ---------------------------------------------------------
  const controllerDir = path.join(moduleDir, 'src', 'Controller');
  fs.mkdirSync(controllerDir, { recursive: true });

  const pageControllerPhp = `<?php

namespace Drupal\\${machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;
use Symfony\\Component\\HttpFoundation\\Response;

/**
 * Serves the ${displayName} Astro app at /${appName}.
 *
 * Returns a raw Symfony Response with the pre-built Astro HTML (dist/page.html),
 * bypassing Drupal's theming layer entirely so no site header/footer/nav appears.
 *
 * Generated by 3PD module generator — do not edit manually.
 */
class PageController extends ControllerBase {

  public function page(): Response {
    $module_path = \\Drupal::service('extension.list.module')->getPath('${machineName}');
    $html_file   = \\Drupal::root() . '/' . $module_path . '/dist/page.html';
    $html        = file_exists($html_file) ? file_get_contents($html_file) : '<p>App not built.</p>';
    if (\\Drupal::currentUser()->isAuthenticated()) {
      $html = str_replace('<body', '<body data-drupal-auth="1"', $html);
    }
    return new Response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);
  }
${additionalPages.map((slug) => `
  public function subpage_${slug.replace(/[^a-z0-9]/gi, '_')}(): Response {
    $module_path = \\Drupal::service('extension.list.module')->getPath('${machineName}');
    $html_file   = \\Drupal::root() . '/' . $module_path . '/dist/${slug}.html';
    $html        = file_exists($html_file) ? file_get_contents($html_file) : '<p>Page not built.</p>';
    if (\\Drupal::currentUser()->isAuthenticated()) {
      $html = str_replace('<body', '<body data-drupal-auth="1"', $html);
    }
    return new Response($html, 200, ['Content-Type' => 'text/html; charset=utf-8']);
  }`).join('\n')}
}
`;

  fs.writeFileSync(path.join(controllerDir, 'PageController.php'), pageControllerPhp);

  // ---------------------------------------------------------
  // Submissions API controller
  // Handles GET /api/<appName>/<table> and POST /api/<appName>/<table>.
  // Replaces the local Express/SQLite backend when running inside Drupal.
  // ---------------------------------------------------------
  const submissionsControllerPhp = `<?php

namespace Drupal\\${machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;
use Symfony\\Component\\HttpFoundation\\JsonResponse;
use Symfony\\Component\\HttpFoundation\\Request;

/**
 * REST-like API for form submissions — mirrors the local Express server.
 *
 * GET  /api/${appName}/${seedData.table}  — returns all rows, newest first.
 * POST /api/${appName}/${seedData.table}  — inserts a new row.
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
  // Menu API controller
  // Reads a named Drupal menu and returns JSON items.
  // ---------------------------------------------------------
  const menuControllerPhp = `<?php

namespace Drupal\\${machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;
use Drupal\\Core\\Menu\\MenuTreeParameters;
use Symfony\\Component\\HttpFoundation\\JsonResponse;
use Symfony\\Component\\HttpFoundation\\Request;

/**
 * Returns Drupal menu items as JSON.
 *
 * GET /api/${appName}/menu/{menu_name}
 *
 * Generated by 3PD module generator — do not edit manually.
 */
class MenuController extends ControllerBase {

  public function items(Request $request, string $menu_name): JsonResponse {
    $menu_tree  = \\Drupal::service('menu.link_tree');
    $parameters = new MenuTreeParameters();
    $parameters->setMinDepth(1)->setMaxDepth(2)->onlyEnabledLinks();
    $tree = $menu_tree->load($menu_name, $parameters);

    $manipulators = [
      ['callable' => 'menu.default_tree_manipulators:checkAccess'],
      ['callable' => 'menu.default_tree_manipulators:generateIndexAndSort'],
    ];
    $tree = $menu_tree->transform($tree, $manipulators);

    $items = [];
    foreach ($tree as $element) {
      $link     = $element->link;
      $url_obj  = $link->getUrlObject();
      $children = [];

      if (!empty($element->subtree)) {
        $child_manipulators = $manipulators;
        $subtree = $menu_tree->transform($element->subtree, $child_manipulators);
        foreach ($subtree as $child_element) {
          $child_link    = $child_element->link;
          $child_url_obj = $child_link->getUrlObject();
          $children[]    = [
            'title'  => $child_link->getTitle(),
            'url'    => $child_url_obj->setAbsolute(FALSE)->toString(),
            'weight' => $child_link->getWeight(),
          ];
        }
      }

      $items[] = [
        'title'    => $link->getTitle(),
        'url'      => $url_obj->setAbsolute(FALSE)->toString(),
        'weight'   => $link->getWeight(),
        'children' => $children,
      ];
    }

    $response = new JsonResponse($items);
    $response->headers->set('Cache-Control', 'no-store');
    return $response;
  }

}
`;

  fs.writeFileSync(path.join(controllerDir, 'MenuController.php'), menuControllerPhp);

  // ---------------------------------------------------------
  // Write .routing.yml — page route + submissions API
  // ---------------------------------------------------------
  const routingYml = `
${machineName}.page:
  path: '/${appName}'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\PageController::page'
    _title: '${humanName}'
  requirements:
    _permission: 'access content'

${additionalPages.map((slug) => {
    const safeSlug = slug.replace(/[^a-z0-9]/gi, '_');
    return `${machineName}.subpage_${safeSlug}:\n  path: '/${appName}/${slug}'\n  defaults:\n    _controller: '\\Drupal\\${machineName}\\Controller\\PageController::subpage_${safeSlug}'\n    _title: '${humanName} \u2014 ${slug}'\n  requirements:\n    _permission: 'access content'`;
  }).join('\n\n')}${additionalPages.length ? '\n\n' : ''}${machineName}.api_submissions_list:
  path: '/api/${appName}/${seedData.table}'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\SubmissionsController::list'
    _title: 'Submissions'
  methods: [GET]
  requirements:
    _permission: 'access content'

${machineName}.api_submissions_create:
  path: '/api/${appName}/${seedData.table}'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\SubmissionsController::submit'
    _title: 'Create Submission'
  methods: [POST]
  requirements:
    _permission: 'access content'

${machineName}.api_menu:
  path: '/api/${appName}/menu/{menu_name}'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\MenuController::items'
    _title: 'Menu'
  methods: [GET]
  requirements:
    _permission: 'access content'
`.trim() + '\n';

  fs.writeFileSync(path.join(moduleDir, `${machineName}.routing.yml`), routingYml);

  // ---------------------------------------------------------
  // 3PD mode ends here
  // ---------------------------------------------------------
  if (is3PD) {
    console.log('\n🎉 HUDX Drupal page module created successfully!');
    console.log(`📍 Location: ${moduleDir}`);
    console.log(`🔗 Page will be available at: /${appName}\n`);
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

  // Resolve page URL from Drupal site URI
  let siteUri = '';
  try {
    siteUri = execSync('lando ssh -c "cd /app && drush status --field=uri" 2>/dev/null', { encoding: 'utf8' }).trim();
  } catch {}
  const pageUrl = siteUri ? `${siteUri}/${appName}` : `/${appName}`;

  console.log('\n🎉 HUDX Drupal page module created and installed!');
  console.log(`📍 Module: ${drupalModuleDir}`);
  console.log(`🔗 Page: ${pageUrl}\n`);
}
