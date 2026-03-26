#!/usr/bin/env node

/**
 * HUDX Module Generator (DXPR-safe, Drupal-aligned, DOM-ready React mount)
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import parser from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";

// ---------------------------------------------------------
// AST-SAFE MemoryRouter enforcement
// ---------------------------------------------------------
function enforceMemoryRouter(appFilePath) {
  const source = fs.readFileSync(appFilePath, "utf8");

  const ast = parser.parse(source, {
    sourceType: "module",
    plugins: ["jsx"],
  });

  traverse.default(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === "react-router-dom") {
        path.node.specifiers = path.node.specifiers.filter(
          (s) => !(s.imported && s.imported.name === "BrowserRouter")
        );

        const hasMR = path.node.specifiers.some(
          (s) => s.imported && s.imported.name === "MemoryRouter"
        );

        if (!hasMR) {
          path.node.specifiers.push(
            t.importSpecifier(
              t.identifier("MemoryRouter"),
              t.identifier("MemoryRouter")
            )
          );
        }
      }
    },

    JSXElement(path) {
      const openingName = path.node.openingElement.name;
      if (
        t.isJSXIdentifier(openingName) &&
        openingName.name === "BrowserRouter"
      ) {
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
        argument.openingElement.name.name === "MemoryRouter"
      ) {
        return;
      }

      path.node.argument = t.jsxElement(
        t.jsxOpeningElement(t.jsxIdentifier("MemoryRouter"), []),
        t.jsxClosingElement(t.jsxIdentifier("MemoryRouter")),
        [argument],
        false
      );
    },
  });

  const output = generate.default(ast, { retainLines: true }).code;
  fs.writeFileSync(appFilePath, output, "utf8");
}

// ---------------------------------------------------------
// Utility: Recursively copy directories
// ---------------------------------------------------------
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ---------------------------------------------------------
// Utility: Try running a command with fallback
// ---------------------------------------------------------
function tryExec(commands) {
  for (const cmd of commands) {
    try {
      execSync(cmd, { stdio: "inherit" });
      return true;
    } catch {}
  }
  return false;
}

// Convert app-name → Human Name
function toHumanName(appName) {
  return appName
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

// ---------------------------------------------------------
// Auto-detect Drupal root
// ---------------------------------------------------------
function findDrupalRoot(startDir) {
  let current = startDir;

  while (true) {
    const webDir = path.join(current, "web");
    const customModulesDir = path.join(webDir, "modules", "custom");

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
// ---------------------------------------------------------
export default async function createModule(appNameFromCli, { internal }) {
  console.log("\n📦 HUDX Module Generator (DXPR-safe, DOM-ready React mount)");

  const appRoot = process.cwd();
  const appName = appNameFromCli || path.basename(appRoot);

  console.log(`App name: ${appName}`);

  const machineName = `hudx_${appName.replace(/-/g, "_")}`;
  const hyphenName = machineName.replace(/_/g, "-");
  const moduleDir = path.join(appRoot, machineName);

  console.log(`Machine name: ${machineName}`);
  console.log(`Hyphen name: ${hyphenName}`);
  console.log(`Module directory: ${moduleDir}`);

  if (fs.existsSync(moduleDir)) {
    fs.rmSync(moduleDir, { recursive: true, force: true });
  }

  // Determine mode
  let is3PD = !internal;
  const drupalWebRoot = findDrupalRoot(appRoot);

  if (!is3PD && !drupalWebRoot) {
    console.log(`
⚠️ INTERNAL mode requested but no Drupal root found.
Falling back to 3PD mode.
`);
    is3PD = true;
  }

  const humanName = toHumanName(appName);
  const displayName = `3PD IDE - ${humanName}`;

  const themeHookKey = `${machineName}_block`;
  const templateName = `${hyphenName}-block`;
  const twigFilename = `${templateName}.html.twig`;
  const mountId = `${hyphenName}-root`;

  // ---------------------------------------------------------
  // Rewrite main.jsx
  // ---------------------------------------------------------
  const entryFile = path.join(appRoot, "src", "main.jsx");

  const behaviorName =
    machineName
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join("") + "Behavior";

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
`;

  fs.writeFileSync(entryFile, entryContent.trim() + "\n", "utf8");
  console.log("🛠 Updated main.jsx");

  // ---------------------------------------------------------
  // Enforce MemoryRouter
  // ---------------------------------------------------------
  const appFile = path.join(appRoot, "src", "App.jsx");
  enforceMemoryRouter(appFile);
  console.log("✔ MemoryRouter enforced");

  // ---------------------------------------------------------
  // Rewrite index.html
  // ---------------------------------------------------------
  const indexHtmlPath = path.join(appRoot, "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    let indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
    indexHtml = indexHtml.replace(
      /<div id="root"><\/div>/g,
      `<div id="${mountId}"></div>`
    );
    fs.writeFileSync(indexHtmlPath, indexHtml, "utf8");
    console.log("🛠 Updated index.html");
  }

  // ---------------------------------------------------------
  // Build React app
  // ---------------------------------------------------------
  console.log("\n⚛️ Building React app...\n");
  execSync("npm run build", { stdio: "inherit" });

  const distDir = path.join(appRoot, "dist");
  const assetsDir = path.join(distDir, "assets");

  const jsFiles = fs
    .readdirSync(assetsDir)
    .filter((f) => f.endsWith(".js") && !f.endsWith(".map"));
  const cssFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".css"));

  const originalJsFile = jsFiles[0];
  const originalCssFile = cssFiles[0];

  const stableJsFile = `${machineName}.js`;
  const stableCssFile = `${machineName}.css`;

  fs.renameSync(path.join(assetsDir, originalJsFile), path.join(assetsDir, stableJsFile));
  fs.renameSync(path.join(assetsDir, originalCssFile), path.join(assetsDir, stableCssFile));

  // ---------------------------------------------------------
  // Create module directory
  // ---------------------------------------------------------
  fs.mkdirSync(moduleDir);

  // Copy assets
  const moduleAssetsDir = path.join(moduleDir, "dist", "assets");
  fs.mkdirSync(moduleAssetsDir, { recursive: true });
  copyRecursive(assetsDir, moduleAssetsDir);

  // ---------------------------------------------------------
  // Write .info.yml
  // ---------------------------------------------------------
  const infoYml = `
name: ${displayName}
type: module
description: '3PD IDE React application module for ${displayName}.'
core_version_requirement: ^10 || ^11
package: 3PD IDE Apps
`;

  fs.writeFileSync(
    path.join(moduleDir, `${machineName}.info.yml`),
    infoYml.trim() + "\n"
  );

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
`;

  fs.writeFileSync(
    path.join(moduleDir, `${machineName}.module`),
    modulePhp.trim() + "\n"
  );

  // ---------------------------------------------------------
  // Write .libraries.yml
  // ---------------------------------------------------------
  const librariesYml = `
${machineName}:
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
`;

  fs.writeFileSync(
    path.join(moduleDir, `${machineName}.libraries.yml`),
    librariesYml.trim() + "\n"
  );

  // ---------------------------------------------------------
  // Block plugin
  // ---------------------------------------------------------
  const blockDir = path.join(moduleDir, "src", "Plugin", "Block");
  fs.mkdirSync(blockDir, { recursive: true });

  const className =
    machineName
      .split("_")
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join("") + "Block";

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
`;

  fs.writeFileSync(
    path.join(blockDir, `${className}.php`),
    blockPhp.trim() + "\n"
  );

  // ---------------------------------------------------------
  // Twig template
  // ---------------------------------------------------------
  const templatesDir = path.join(moduleDir, "templates");
  fs.mkdirSync(templatesDir);

  const twig = `
<div id="${mountId}"></div>
`;

  fs.writeFileSync(
    path.join(templatesDir, twigFilename),
    twig.trim() + "\n"
  );

  // ---------------------------------------------------------
  // 3PD mode ends here
  // ---------------------------------------------------------
  if (is3PD) {
    console.log("\n🎉 HUDX Drupal module created successfully!");
    console.log(`📍 Location: ${moduleDir}\n`);
    return;
  }

  // ---------------------------------------------------------
  // INTERNAL MODE
  // ---------------------------------------------------------
  console.log("\n🔧 INTERNAL MODE ENABLED");

  // FIXED: Correct Drupal module destination
  const drupalModuleDir = path.join(
    drupalWebRoot,
    "modules",
    "custom",
    machineName
  );

  if (fs.existsSync(drupalModuleDir)) {
    fs.rmSync(drupalModuleDir, { recursive: true, force: true });
  }

  copyRecursive(moduleDir, drupalModuleDir);

  console.log("\n⚙️ Enabling module...");

  // FIXED: Correct Drush working directory
  tryExec([
    `lando ssh -c "cd /app/web && drush en ${machineName} -y"`,
    `cd ${path.dirname(drupalWebRoot)} && drush en ${machineName} -y`,
  ]);

  console.log("\n🧹 Clearing caches...");
  tryExec([
    `lando ssh -c "cd /app/web && drush cr"`,
    `cd ${path.dirname(drupalWebRoot)} && drush cr`,
  ]);

  console.log("\n🎉 HUDX Drupal module created and installed!");
  console.log(`📍 Module: ${drupalModuleDir}\n`);
}
