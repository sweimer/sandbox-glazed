#!/usr/bin/env node

/**
 * Fuse Module Generator (DXPR-safe, Drupal-aligned, DOM-ready mount)
 *
 * Drupal rules:
 * - Theme hook keys MUST use underscores.
 * - Template names MUST use hyphens.
 * - Twig filenames MUST use hyphens.
 * - #theme MUST use underscore key.
 *
 * DXPR rules:
 * - Libraries may be injected inline even with header: true.
 * - App must wait for DOMContentLoaded + mount div existence.
 *
 * Fuse rules:
 * - Vite bundles require type: module.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';

// ---------------------------------------------------------
// AST-SAFE MemoryRouter enforcement for App.jsx
// - Ensures MemoryRouter is used
// - Removes BrowserRouter import + JSX usage
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
        // Remove BrowserRouter if present
        path.node.specifiers = path.node.specifiers.filter(
          (s) => !(s.imported && s.imported.name === 'BrowserRouter')
        );

        // Ensure MemoryRouter is imported
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
// Utility: Recursively copy directories
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

// Utility: Try running a command with fallback
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
// Auto-detect Drupal root (web/) for INTERNAL mode
// - Walks upward from appRoot
// - Looks for a "web/modules/custom" directory
// ---------------------------------------------------------
function findDrupalRoot(startDir) {
  let current = startDir;

  while (true) {
    const webDir = path.join(current, 'web');
    const customModulesDir = path.join(webDir, 'modules', 'custom');

    if (fs.existsSync(webDir) && fs.existsSync(customModulesDir)) {
      return webDir;
    }

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

// ---------------------------------------------------------
// MAIN EXPORTED FUNCTION
// Called by: starter-scripts/cli/commands/fuse-module.js
// ---------------------------------------------------------
export default async function createModule(appNameFromCli, { internal }) {
  console.log('\n📦 Fuse Module Generator (DXPR-safe, DOM-ready mount)');

  const appRoot = process.cwd();
  const appName = appNameFromCli || path.basename(appRoot);

  console.log(`App name: ${appName}`);

  const machineName = `hudx_${appName.replace(/-/g, '_')}`;
  const hyphenName  = machineName.replace(/_/g, '-');
  const moduleDir   = path.join(appRoot, machineName);

  console.log(`Machine name: ${machineName}`);
  console.log(`Hyphen name:  ${hyphenName}`);
  console.log(`Module dir:   ${moduleDir}`);

  if (fs.existsSync(moduleDir)) {
    fs.rmSync(moduleDir, { recursive: true, force: true });
  }

  // ---------------------------------------------------------
  // Determine mode
  // --install / --internal flag comes in via the CLI options
  // ---------------------------------------------------------
  let is3PD = !internal;
  const drupalWebRoot = findDrupalRoot(appRoot);

  if (!is3PD && !drupalWebRoot) {
    console.log(`
⚠️  Internal mode requested but no Drupal web/ directory was found
    by walking upward from this app folder.

    The module will be generated locally but will NOT be copied into
    /web or enabled. A HUDX developer will complete that step on review.
`);
    is3PD = true;
  }

  const humanName  = toHumanName(appName);
  const displayName = `3PD IDE - ${humanName}`;

  const themeHookKey = `${machineName}_block`;  // underscores  (Drupal rule)
  const templateName = `${hyphenName}-block`;    // hyphens      (Drupal rule)
  const twigFilename = `${templateName}.html.twig`;
  const mountId      = `${hyphenName}-root`;

  // ---------------------------------------------------------
  // Rewrite src/main.jsx (Drupal behaviors + DXPR-safe mount)
  // ---------------------------------------------------------
  const entryFile = path.join(appRoot, 'src', 'main.jsx');

  if (!fs.existsSync(entryFile)) {
    console.error(`❌ Entry file not found: ${entryFile}`);
    process.exit(1);
  }

  const behaviorName =
    machineName
      .split('_')
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join('') + 'Behavior';

  const entryContent = `
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

function mountFuseApp(context = document) {
  const el = context.getElementById
    ? context.getElementById("${mountId}")
    : document.getElementById("${mountId}");

  if (!el) return;

  if (!el.__fuseRoot) {
    el.__fuseRoot = ReactDOM.createRoot(el);
  }

  el.__fuseRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

function waitForMount() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mountFuseApp());
  } else {
    mountFuseApp();
  }
}

waitForMount();

if (typeof window !== "undefined" && window.Drupal && window.Drupal.behaviors) {
  (function (Drupal) {
    Drupal.behaviors.${behaviorName} = {
      attach(context) {
        mountFuseApp(context);
      },
    };
  })(window.Drupal);
}
`;

  fs.writeFileSync(entryFile, entryContent.trim() + '\n', 'utf8');
  console.log('🛠  Updated main.jsx with DXPR-safe, Drupal-behaviors-aware mount logic');

  // ---------------------------------------------------------
  // Enforce MemoryRouter in App.jsx
  // ---------------------------------------------------------
  const appFile = path.join(appRoot, 'src', 'App.jsx');

  if (!fs.existsSync(appFile)) {
    console.error(`❌ App.jsx not found: ${appFile}`);
    process.exit(1);
  }

  console.log('🧠  Enforcing MemoryRouter in App.jsx (AST-safe)...');
  enforceMemoryRouter(appFile);
  console.log('✔  MemoryRouter applied (BrowserRouter removed if present).');

  // ---------------------------------------------------------
  // Rewrite index.html mount ID for dev server
  // ---------------------------------------------------------
  const indexHtmlPath = path.join(appRoot, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    indexHtml = indexHtml.replace(
      /<div id="root"><\/div>/g,
      `<div id="${mountId}"></div>`
    );
    fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
    console.log('🛠  Updated index.html to use Fuse mount ID');
  }

  // ---------------------------------------------------------
  // Build Fuse app
  // ---------------------------------------------------------
  console.log('\n⚙️  Building Fuse app...\n');
  execSync('npm run build', { stdio: 'inherit' });

  const distDir    = path.join(appRoot, 'dist');
  const assetsDir  = path.join(distDir, 'assets');

  if (!fs.existsSync(assetsDir)) {
    console.error('❌ Vite build output not found at dist/assets');
    process.exit(1);
  }

  const jsFiles  = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js')  && !f.endsWith('.map'));
  const cssFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.css'));

  if (jsFiles.length === 0)  { console.error('❌ No JS bundle found in dist/assets');  process.exit(1); }
  if (cssFiles.length === 0) { console.error('❌ No CSS bundle found in dist/assets'); process.exit(1); }

  console.log(`Detected JS:  ${jsFiles[0]}`);
  console.log(`Detected CSS: ${cssFiles[0]}`);

  // ---------------------------------------------------------
  // Stabilise filenames to Drupal-style machine name
  // ---------------------------------------------------------
  const stableJsFile  = `${machineName}.js`;
  const stableCssFile = `${machineName}.css`;

  fs.renameSync(path.join(assetsDir, jsFiles[0]),  path.join(assetsDir, stableJsFile));
  fs.renameSync(path.join(assetsDir, cssFiles[0]), path.join(assetsDir, stableCssFile));

  console.log(`Renamed JS  → ${stableJsFile}`);
  console.log(`Renamed CSS → ${stableCssFile}`);

  // ---------------------------------------------------------
  // Create module directory + copy assets
  // ---------------------------------------------------------
  fs.mkdirSync(moduleDir);

  const moduleAssetsDir = path.join(moduleDir, 'dist', 'assets');
  fs.mkdirSync(moduleAssetsDir, { recursive: true });
  copyRecursive(assetsDir, moduleAssetsDir);

  // ---------------------------------------------------------
  // Write .info.yml
  // ---------------------------------------------------------
  fs.writeFileSync(
    path.join(moduleDir, `${machineName}.info.yml`),
    `name: ${displayName}
type: module
description: '3PD IDE Fuse application module for ${displayName}.'
core_version_requirement: ^10 || ^11
package: 3PD IDE Apps
`
  );

  // ---------------------------------------------------------
  // Write .module
  // ---------------------------------------------------------
  fs.writeFileSync(
    path.join(moduleDir, `${machineName}.module`),
    `<?php

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
`
  );

  // ---------------------------------------------------------
  // Write .libraries.yml
  // ---------------------------------------------------------
  fs.writeFileSync(
    path.join(moduleDir, `${machineName}.libraries.yml`),
    `${machineName}:
  version: 1.x
  js:
    dist/assets/${stableJsFile}:
      header: true
      attributes:
        type: module
  css:
    theme:
      dist/assets/${stableCssFile}: {}
  dependencies:
    - core/drupal
`
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

  fs.writeFileSync(
    path.join(blockDir, `${className}.php`),
    `<?php

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
`
  );

  // ---------------------------------------------------------
  // Twig template
  // ---------------------------------------------------------
  const templatesDir = path.join(moduleDir, 'templates');
  fs.mkdirSync(templatesDir);

  fs.writeFileSync(
    path.join(templatesDir, twigFilename),
    `<div id="${mountId}"></div>\n`
  );

  // ---------------------------------------------------------
  // 3PD mode ends here
  // ---------------------------------------------------------
  if (is3PD) {
    console.log('\n🎉 Fuse Drupal module created successfully!');
    console.log(`📍 Location: ${moduleDir}`);
    console.log(`
Next steps:
1. Commit the generated module folder.
2. Submit your feature branch for HUDX review.
`);
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

  console.log(`\n📁 Copying module into Drupal: ${drupalModuleDir}`);

  if (fs.existsSync(drupalModuleDir)) {
    fs.rmSync(drupalModuleDir, { recursive: true, force: true });
  }

  copyRecursive(moduleDir, drupalModuleDir);

  console.log('\n⚙️  Enabling module...');
  tryExec([
    `lando ssh -c "cd /app/web && drush en ${machineName} -y"`,
    `cd ${path.dirname(drupalWebRoot)} && drush en ${machineName} -y`,
  ]);

  console.log('\n🧹  Clearing caches...');
  tryExec([
    `lando ssh -c "cd /app/web && drush cr"`,
    `cd ${path.dirname(drupalWebRoot)} && drush cr`,
  ]);

  console.log('\n🎉 Fuse Drupal module created and installed!');
  console.log(`📍 Module: ${drupalModuleDir}\n`);
}
