#!/usr/bin/env node

/**
 * HUDX Module Generator (DXPR-safe, Drupal-aligned, DOM-ready React mount)
 *
 * Drupal rules:
 * - Theme hook keys MUST use underscores.
 * - Template names MUST use hyphens.
 * - Twig filenames MUST use hyphens.
 * - #theme MUST use underscore key.
 *
 * DXPR rules:
 * - Libraries may be injected inline even with header: true.
 * - React must wait for DOMContentLoaded + mount div existence.
 *
 * React rules:
 * - Vite bundles require type: module.
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { execSync } = require("child_process");

// AST tooling
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const t = require("@babel/types");

// ---------------------------------------------------------
// AST-SAFE MemoryRouter enforcement for App.jsx
// - Ensures MemoryRouter is used
// - Removes BrowserRouter import + JSX usage
// ---------------------------------------------------------
function enforceMemoryRouter(appFilePath) {
  const source = fs.readFileSync(appFilePath, "utf8");

  const ast = parser.parse(source, {
    sourceType: "module",
    plugins: ["jsx"],
  });

  traverse(ast, {
    ImportDeclaration(path) {
      if (path.node.source.value === "react-router-dom") {
        // Remove BrowserRouter if present
        path.node.specifiers = path.node.specifiers.filter((s) => {
          return !(s.imported && s.imported.name === "BrowserRouter");
        });

        // Ensure MemoryRouter is imported
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
      if (t.isJSXIdentifier(openingName) && openingName.name === "BrowserRouter") {
        // Replace <BrowserRouter>...</BrowserRouter> with its children
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

  const output = generate(ast, { retainLines: true }).code;
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

// Utility: Try running a command with fallback
function tryExec(commands) {
  for (const cmd of commands) {
    try {
      execSync(cmd, { stdio: "inherit" });
      return true;
    } catch (e) {}
  }
  return false;
}

// Prompt wrapper
function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    })
  );
}

// Convert app-name → Human Name
function toHumanName(appName) {
  return appName
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

(async () => {
  console.log("\n📦 HUDX Module Generator (DXPR-safe, DOM-ready React mount)");

  // ---------------------------------------------------------
  // 1. Determine app + module names
  // ---------------------------------------------------------
  const appRoot = process.cwd();
  const appName = path.basename(appRoot);

  console.log(`App name: ${appName}`);

  // Machine name uses underscores
  const machineName = `hudx_${appName.replace(/-/g, "_")}`;
  console.log(`Machine name: ${machineName}`);

  // Hyphen name for template + mount ID
  const hyphenName = machineName.replace(/_/g, "-");
  console.log(`Hyphen name: ${hyphenName}`);

  const moduleDir = path.join(appRoot, machineName);
  console.log(`Module directory: ${moduleDir}`);

  if (fs.existsSync(moduleDir)) {
    fs.rmSync(moduleDir, { recursive: true, force: true });
  }

  // ---------------------------------------------------------
  // 2. Ask for 3PD mode
  // ---------------------------------------------------------
  const thirdPartyAnswer = await ask(
    "\nAre you a 3rd Party App developer? (y/n): "
  );
  let is3PD = thirdPartyAnswer === "y";

  // ---------------------------------------------------------
  // 3. Failsafe: If user says "n" but /web doesn't exist, force 3PD mode
  // ---------------------------------------------------------
  const webDir = path.join(appRoot, "..", "..", "web");

  if (!is3PD && !fs.existsSync(webDir)) {
    console.log(`
⚠️  You selected "internal developer" mode, but no /web directory was found.
    This means you are likely a 3rd‑party developer or working outside a full HUDX repo.

    The module will be generated, but will NOT be copied into /web or enabled.
    HUDX internal developers will complete that step when your branch is submitted.
`);
    is3PD = true;
  }

  // ---------------------------------------------------------
  // 4. Generate names + mount ID (before build)
  // ---------------------------------------------------------
  const humanName = toHumanName(appName);
  const displayName = `Decoupled - ${humanName}`;

  // Correct Drupal split:
  const themeHookKey = `${machineName}_block`; // underscores
  const templateName = `${hyphenName}-block`; // hyphens
  const twigFilename = `${templateName}.html.twig`; // hyphens
  const mountId = `${hyphenName}-root`; // hyphens

  // ---------------------------------------------------------
  // 5. Rewrite React entry file BEFORE build (Drupal behaviors + DXPR-safe mount)
  // ---------------------------------------------------------
  const entryFile = path.join(appRoot, "src", "main.jsx");

  if (!fs.existsSync(entryFile)) {
    console.error(`❌ React entry file not found: ${entryFile}`);
    process.exit(1);
  }

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

  if (!el) {
    return;
  }

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
  console.log("🛠 Updated main.jsx with DXPR-safe, Drupal-behaviors-aware mount logic");

  // ---------------------------------------------------------
  // 6. Enforce MemoryRouter BEFORE build (and remove BrowserRouter)
  // ---------------------------------------------------------
  const appFile = path.join(appRoot, "src", "App.jsx");

  if (!fs.existsSync(appFile)) {
    console.error(`❌ App.jsx not found: ${appFile}`);
    process.exit(1);
  }

  console.log("🧠 Enforcing MemoryRouter in App.jsx (AST-safe)...");
  enforceMemoryRouter(appFile);
  console.log("✔ MemoryRouter applied safely (BrowserRouter removed if present).");

  // ---------------------------------------------------------
  // 7. Rewrite index.html mount ID for dev server
  // ---------------------------------------------------------
  const indexHtmlPath = path.join(appRoot, "index.html");
  if (fs.existsSync(indexHtmlPath)) {
    let indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
    indexHtml = indexHtml.replace(
      /<div id="root"><\/div>/,
      `<div id="${mountId}"></div>`
    );
    indexHtml = indexHtml.replace(
      /<div id="root"><\/div>/,
      `<div id="${mountId}"></div>`
    );
    fs.writeFileSync(indexHtmlPath, indexHtml, "utf8");
    console.log("🛠 Updated index.html to use HUDX mount ID for dev mode");
  } else {
    console.log("ℹ️ index.html not found, skipping dev mount ID rewrite");
  }

  // ---------------------------------------------------------
  // 8. Build React app
  // ---------------------------------------------------------
  console.log("\n⚛️ Building React app...\n");
  execSync("npm run build", { stdio: "inherit" });

  const distDir = path.join(appRoot, "dist");
  const assetsDir = path.join(distDir, "assets");

  if (!fs.existsSync(assetsDir)) {
    console.error("❌ ERROR: Vite build output not found at dist/assets");
    process.exit(1);
  }

  const jsFiles = fs
    .readdirSync(assetsDir)
    .filter((f) => f.endsWith(".js") && !f.endsWith(".map"));
  const cssFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".css"));

  if (jsFiles.length === 0) {
    console.error("❌ No JS bundle found in dist/assets");
    process.exit(1);
  }
  if (cssFiles.length === 0) {
    console.error("❌ No CSS bundle found in dist/assets");
    process.exit(1);
  }

  const originalJsFile = jsFiles[0];
  const originalCssFile = cssFiles[0];

  console.log(`Detected JS: ${originalJsFile}`);
  console.log(`Detected CSS: ${originalCssFile}`);

  // ---------------------------------------------------------
  // 9. Stabilize filenames to Drupal-style machine name
  // ---------------------------------------------------------
  const stableJsFile = `${machineName}.js`;
  const stableCssFile = `${machineName}.css`;

  const stableJsPath = path.join(assetsDir, stableJsFile);
  const stableCssPath = path.join(assetsDir, stableCssFile);

  fs.renameSync(path.join(assetsDir, originalJsFile), stableJsPath);
  fs.renameSync(path.join(assetsDir, originalCssFile), stableCssPath);

  console.log(`Renamed JS to: ${stableJsFile}`);
  console.log(`Renamed CSS to: ${stableCssFile}`);

  // ---------------------------------------------------------
  // 10. Create module directory
  // ---------------------------------------------------------
  fs.mkdirSync(moduleDir);

  // ---------------------------------------------------------
  // 11. Copy assets
  // ---------------------------------------------------------
  const moduleAssetsDir = path.join(moduleDir, "dist", "assets");
  fs.mkdirSync(moduleAssetsDir, { recursive: true });

  copyRecursive(assetsDir, moduleAssetsDir);

  // ---------------------------------------------------------
  // 12. Write .info.yml
  // ---------------------------------------------------------
  const infoYml = `
name: ${displayName}
type: module
description: 'Decoupled React application module for ${displayName}.'
core_version_requirement: ^10 || ^11
package: Decoupled Apps
`;

  fs.writeFileSync(
    path.join(moduleDir, `${machineName}.info.yml`),
    infoYml.trim() + "\n"
  );

  // ---------------------------------------------------------
  // 13. Write .module (correct underscore/hyphen split)
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
  // 14. Write .libraries.yml (DXPR-safe, ES module-safe, stable filenames)
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
  // 15. Create Block plugin (underscore theme key)
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
  // 16. Create Twig template (hyphens)
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
  // 17. 3PD Mode stops here
  // ---------------------------------------------------------
  if (is3PD) {
    console.log("\n🎉 HUDX Drupal module created successfully!");
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
  console.log("\n🔧 INTERNAL MODE ENABLED");

  const drupalModuleDir = path.join(
    appRoot,
    "..",
    "..",
    "web",
    "modules",
    "custom",
    machineName
  );

  console.log(`\n📁 Copying module into Drupal: ${drupalModuleDir}`);

  if (fs.existsSync(drupalModuleDir)) {
    fs.rmSync(drupalModuleDir, { recursive: true, force: true });
  }

  copyRecursive(moduleDir, drupalModuleDir);

  console.log("\n⚙️ Enabling module...");
  tryExec([
    `lando ssh -c "cd /app/drupal && drush en ${machineName} -y"`,
    `cd drupal && drush en ${machineName} -y`,
  ]);

  console.log("\n🧹 Clearing caches...");
  tryExec([
    `lando ssh -c "cd /app/drupal && drush cr"`,
    `cd drupal && drush cr`,
  ]);

  console.log("\n🎉 HUDX Drupal module created and installed!");
  console.log(`📍 Module: ${drupalModuleDir}\n`);
})();
