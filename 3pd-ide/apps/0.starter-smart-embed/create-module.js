#!/usr/bin/env node

/**
 * HUDX Module Generator — Smart Embed
 *
 * Reads embed.config.json from the current app directory and generates a
 * Drupal block module that iframes the target URL with postMessage auto-resize.
 *
 * Two modes (set one in embed.config.json):
 *
 *   embedUrl   — External URL mode. Iframes a live external URL.
 *                { "embedUrl": "https://example.com/app/" }
 *
 *   staticDir  — Static hosting mode. Copies a local static app into
 *                web/embeds/<slug>/ so Apache serves it directly (bypasses PHP).
 *                Injects hudx-resize.js into every .html file automatically.
 *                { "staticDir": "smart-embeds/sc-training" }
 *                Path is relative to the 3pd-ide/ root (ideRoot).
 *
 * Generated module contains:
 *   - Block plugin (PHP) with hardcoded EMBED_URL constant
 *   - JS listener (Drupal.behaviors) for hudx-resize postMessage events
 *   - CSS: full-width iframe, no border
 *   - Test page route: /hudx-test/<app-name>
 *
 * No build step. No npm. No framework. Pure Drupal module output.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// ---------------------------------------------------------
// Utility: recursively copy a directory
// ---------------------------------------------------------
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

// ---------------------------------------------------------
// Utility: try running a command, silently skip if it fails
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
// Auto-detect 3pd-ide root (contains apps/ directory)
// ---------------------------------------------------------
function findIdeRoot(startDir) {
  let current = startDir;
  while (true) {
    if (fs.existsSync(path.join(current, 'apps')) && fs.existsSync(path.join(current, 'starter-scripts'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

// ---------------------------------------------------------
// Auto-detect Drupal web root by walking up from startDir
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
// Convert hyphen-slug → PascalCase class name
// ---------------------------------------------------------
function toPascalCase(slug) {
  return slug
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

// ---------------------------------------------------------
// MAIN
// ---------------------------------------------------------
export default async function createModule(appNameFromCli, { internal }) {
  console.log('\n📦 HUDX Module Generator (Smart Embed)');

  const appRoot = process.cwd();
  const appName = appNameFromCli || path.basename(appRoot);

  // Read embed.config.json
  const configPath = path.join(appRoot, 'embed.config.json');
  if (!fs.existsSync(configPath)) {
    console.error('❌  embed.config.json not found.');
    console.error('    Run: 3pd embed create <name>');
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    console.error('❌  embed.config.json is not valid JSON.');
    process.exit(1);
  }

  const staticDir      = config.staticDir || '';
  let   embedUrl       = config.embedUrl  || '';
  const embedTitle     = config.title || toPascalCase(appName);
  const fallbackHeight = parseInt(config.fallbackHeight, 10) || 600;

  // Derive slug: strip 'embed---' prefix for use in served path
  const slug = appName.replace(/^embed---/, '');

  // ---------------------------------------------------------
  // Static hosting mode: resolve staticDir, copy files later
  // (actual copy happens in --install block below)
  // ---------------------------------------------------------
  let resolvedStaticDir = null;
  if (staticDir) {
    // staticDir is relative to ideRoot (3pd-ide/ parent).
    // Walk up from appRoot to find ideRoot (contains apps/ directory).
    const ideRoot = findIdeRoot(appRoot);
    if (!ideRoot) {
      console.error('❌  Could not locate 3pd-ide root. Make sure you are running from inside an embed app folder.');
      process.exit(1);
    }
    resolvedStaticDir = path.resolve(ideRoot, staticDir);
    if (!fs.existsSync(resolvedStaticDir)) {
      console.error(`❌  staticDir not found: ${resolvedStaticDir}`);
      process.exit(1);
    }
    // The iframe src will be the internal Drupal-served path
    embedUrl = `/embeds/${slug}/`;
    console.log(`  Static mode:   ${resolvedStaticDir} → web/embeds/${slug}/`);
  } else if (!embedUrl || embedUrl === 'YOUR_EMBED_URL') {
    console.error('❌  Set either "embedUrl" or "staticDir" in embed.config.json.');
    process.exit(1);
  }

  const machineName = `hudx_${appName.replace(/-/g, '_')}`;
  const hyphenName  = machineName.replace(/_/g, '-');
  const moduleDir   = path.join(appRoot, machineName);
  const className   = toPascalCase(appName) + 'Block';
  const version     = Date.now();

  // Human-readable slug (without framework prefix) for display names
  const humanSlug = slug
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');

  console.log(`  App name:      ${appName}`);
  console.log(`  Machine name:  ${machineName}`);
  console.log(`  Embed URL:     ${embedUrl}`);
  console.log(`  Module dir:    ${moduleDir}`);

  // Clean + recreate module directory
  if (fs.existsSync(moduleDir)) {
    fs.rmSync(moduleDir, { recursive: true, force: true });
  }
  fs.mkdirSync(moduleDir, { recursive: true });

  // ---------------------------------------------------------
  // .info.yml
  // ---------------------------------------------------------
  fs.writeFileSync(
    path.join(moduleDir, `${machineName}.info.yml`),
    `name: '3PD IDE - Smart Embed   ${humanSlug}'
type: module
description: '3PD IDE Smart Embed application module for 3PD IDE - Smart Embed   ${humanSlug}.'
core_version_requirement: ^10 || ^11
package: 3PD IDE Apps
configure: ${machineName}.test_page
`
  );

  // ---------------------------------------------------------
  // .libraries.yml
  // ---------------------------------------------------------
  fs.writeFileSync(
    path.join(moduleDir, `${machineName}.libraries.yml`),
    `smart-embed:
  version: ${version}
  css:
    component:
      css/smart-embed.css: {}
  js:
    js/smart-embed.js: { minified: false }
  dependencies:
    - core/drupal
    - core/once
`
  );

  // ---------------------------------------------------------
  // CSS: full-width iframe, no border, smooth height transition
  // ---------------------------------------------------------
  fs.mkdirSync(path.join(moduleDir, 'css'), { recursive: true });
  fs.writeFileSync(
    path.join(moduleDir, 'css', 'smart-embed.css'),
    `.hudx-smart-embed {
  width: 100%;
  overflow: hidden;
  position: relative;
}

.hudx-smart-embed__iframe {
  /* 1px + min-width trick prevents horizontal scrollbar flash */
  width: 1px;
  min-width: 100%;
  border: none;
  display: block;
  overflow: hidden;
  transition: height 0.2s ease;
}
`
  );

  // ---------------------------------------------------------
  // JS: Drupal.behaviors postMessage listener
  // ---------------------------------------------------------
  fs.mkdirSync(path.join(moduleDir, 'js'), { recursive: true });
  fs.writeFileSync(
    path.join(moduleDir, 'js', 'smart-embed.js'),
    `/**
 * HUDX Smart Embed — parent-side resize listener.
 * Listens for hudx-resize postMessage from the embedded iframe child
 * and updates the iframe height accordingly.
 *
 * Generated by 3PD module generator. Do not edit manually.
 */
(function (Drupal, once) {
  'use strict';

  Drupal.behaviors.hudxSmartEmbed = {
    attach(context) {
      once('hudx-smart-embed', '.hudx-smart-embed', context).forEach(function (wrapper) {
        var iframe = wrapper.querySelector('iframe');
        if (!iframe) return;

        // Apply fallback height until the child sends its real height
        iframe.style.height = '${fallbackHeight}px';

        window.addEventListener('message', function (e) {
          if (
            e.data &&
            e.data.type === 'hudx-resize' &&
            typeof e.data.height === 'number' &&
            e.data.height > 0
          ) {
            iframe.style.height = e.data.height + 'px';
          }
        });
      });
    },
  };
})(Drupal, once);
`
  );

  // ---------------------------------------------------------
  // Block plugin PHP
  // ---------------------------------------------------------
  fs.mkdirSync(path.join(moduleDir, 'src', 'Plugin', 'Block'), { recursive: true });
  fs.writeFileSync(
    path.join(moduleDir, 'src', 'Plugin', 'Block', `${className}.php`),
    `<?php

namespace Drupal\\${machineName}\\Plugin\\Block;

use Drupal\\Core\\Block\\BlockBase;
use Drupal\\Core\\Render\\Markup;

/**
 * Provides a smart embed block for ${embedTitle}.
 *
 * @Block(
 *   id = "${machineName}_block",
 *   admin_label = @Translation("${embedTitle} — Smart Embed"),
 *   category = @Translation("HUDX")
 * )
 */
class ${className} extends BlockBase {

  /**
   * The URL to embed. Set at module generation time.
   */
  const EMBED_URL = '${embedUrl}';

  /**
   * Human-readable title for the iframe (accessibility).
   */
  const EMBED_TITLE = '${embedTitle}';

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    return [
      '#markup' => Markup::create('<div class="hudx-smart-embed"><iframe class="hudx-smart-embed__iframe" src="' . self::EMBED_URL . '" frameborder="0" scrolling="no" title="' . self::EMBED_TITLE . '" allowfullscreen></iframe></div>'),
      '#attached' => [
        'library' => ['${machineName}/smart-embed'],
      ],
    ];
  }

}
`
  );

  // ---------------------------------------------------------
  // Test page: routing.yml + HudxTestController
  // ---------------------------------------------------------
  fs.writeFileSync(
    path.join(moduleDir, `${machineName}.routing.yml`),
    `${machineName}.test_page:
  path: '/hudx-test/${appName}'
  defaults:
    _controller: '\\Drupal\\${machineName}\\Controller\\HudxTestController::page'
    _title: '${embedTitle}'
  requirements:
    _permission: 'access content'
`
  );

  fs.mkdirSync(path.join(moduleDir, 'src', 'Controller'), { recursive: true });
  fs.writeFileSync(
    path.join(moduleDir, 'src', 'Controller', 'HudxTestController.php'),
    `<?php

namespace Drupal\\${machineName}\\Controller;

use Drupal\\Core\\Controller\\ControllerBase;

/**
 * Test page — renders the smart embed block directly for development.
 */
class HudxTestController extends ControllerBase {

  /**
   * Renders the smart embed block on a standalone test page.
   */
  public function page(): array {
    $plugin = \\Drupal::service('plugin.manager.block')
      ->createInstance('${machineName}_block', []);
    return $plugin->build();
  }

}
`
  );

  console.log(`\n  ✅  Module generated: ${moduleDir}`);

  // ---------------------------------------------------------
  // --install mode: copy to Drupal + enable + cache clear
  // ---------------------------------------------------------
  if (internal) {
    const drupalWebRoot = findDrupalRoot(appRoot);
    if (!drupalWebRoot) {
      console.error('❌  Could not locate Drupal web root (web/modules/custom/).');
      process.exit(1);
    }

    // Static hosting: copy files to web/embeds/<slug>/ + inject resize snippet
    if (resolvedStaticDir) {
      const embedsDir  = path.join(drupalWebRoot, 'embeds', slug);
      const snippetSrc = path.resolve(
        path.dirname(new URL(import.meta.url).pathname),
        'snippet', 'hudx-resize.js'
      );

      console.log(`\n  📂  Deploying static files → ${embedsDir}`);
      if (fs.existsSync(embedsDir)) fs.rmSync(embedsDir, { recursive: true, force: true });
      copyRecursive(resolvedStaticDir, embedsDir);

      // Copy hudx-resize.js into the deployed static root
      if (fs.existsSync(snippetSrc)) {
        fs.copyFileSync(snippetSrc, path.join(embedsDir, 'hudx-resize.js'));
        console.log(`  ✅  hudx-resize.js copied into static files.`);
      } else {
        console.warn('  ⚠   hudx-resize.js snippet not found in starter — skipping injection.');
      }

      // Inject <script src="hudx-resize.js"></script> before </body> in every .html file
      const htmlFiles = fs.readdirSync(embedsDir).filter((f) => f.endsWith('.html'));
      let injected = 0;
      for (const htmlFile of htmlFiles) {
        const filePath = path.join(embedsDir, htmlFile);
        let content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('hudx-resize.js')) {
          content = content.replace(
            /<\/body>/i,
            '<script src="hudx-resize.js"></script>\n</body>'
          );
          fs.writeFileSync(filePath, content, 'utf8');
          injected++;
        }
      }
      console.log(`  ✅  hudx-resize.js injected into ${injected} HTML files.`);
    }

    const targetDir = path.join(drupalWebRoot, 'modules', 'custom', machineName);
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    copyRecursive(moduleDir, targetDir);
    console.log(`  ✅  Module copied to: ${targetDir}`);

    // Uninstall first (ignore failure — module may not be installed yet)
    tryExec([`lando drush pm:uninstall ${machineName} -y`]);

    // Enable
    const enabled = tryExec([
      `lando drush pm:enable ${machineName} -y`,
      `lando drush php:eval "\\Drupal::service('module_installer')->install(['${machineName}']);"`,
    ]);

    if (!enabled) {
      console.warn('  ⚠   Could not enable module automatically. Enable it manually via Drupal Extend.');
    }

    // Cache clear + router rebuild
    tryExec(['lando crx']);
    tryExec([`lando drush php:eval "\\Drupal::service('router.builder')->rebuild();"`]);

    console.log(`\n  ✅  Installed. Test at: /hudx-test/${appName}`);
    console.log(`      Block available in: Layout Builder → Add Block → HUDX → ${embedTitle} — Smart Embed`);
  }
}
