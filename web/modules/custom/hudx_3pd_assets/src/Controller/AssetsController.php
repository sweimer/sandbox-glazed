<?php

namespace Drupal\hudx_3pd_assets\Controller;

use Drupal\Core\Controller\ControllerBase;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * Serves compiled theme assets at public URLs for 3PD starter kit apps.
 *
 * Routes:
 *   GET /3pd-assets/styles.css   → compiled CSS from the active theme
 *   GET /3pd-assets/scripts.js   → compiled JS from the active theme
 *   GET /3pd-assets/config.json  → { themeSystem, themeName, version }
 *
 * Install this module once per Drupal project. Point 3pd.config.json
 * assetsUrl at this site's base URL + /3pd-assets.
 *
 * 3PD developers load styles from this URL during local dev instead of
 * generating drupal-dev-styles.css locally (which requires the full
 * Drupal codebase). Page mode modules also load CSS from this URL at
 * runtime instead of a hardcoded CDN.
 */
class AssetsController extends ControllerBase {

  /**
   * Returns the active theme's compiled CSS.
   */
  public function styles(): Response {
    $css = $this->collectThemeCss();
    $response = new Response($css, 200, [
      'Content-Type'  => 'text/css; charset=utf-8',
      'Cache-Control' => 'public, max-age=300',
      'Access-Control-Allow-Origin' => '*',
    ]);
    return $response;
  }

  /**
   * Returns the active theme's compiled JS.
   */
  public function scripts(): Response {
    $js = $this->collectThemeJs();
    $response = new Response($js, 200, [
      'Content-Type'  => 'application/javascript; charset=utf-8',
      'Cache-Control' => 'public, max-age=300',
      'Access-Control-Allow-Origin' => '*',
    ]);
    return $response;
  }

  /**
   * Returns project config JSON for the 3PD CLI.
   *
   * The CLI reads this on `3pd astro-forms app <name>` to auto-detect
   * themeSystem and avoid requiring manual 3pd.config.json setup.
   */
  public function themeConfig(): JsonResponse {
    $theme_name = \Drupal::service('theme.manager')->getActiveTheme()->getName();
    $theme_info = \Drupal::service('extension.list.theme')->get($theme_name);

    // Detect themeSystem from theme dependencies.
    $theme_system = $this->detectThemeSystem($theme_info);

    $response = new JsonResponse([
      'themeSystem' => $theme_system,
      'themeName'   => $theme_name,
      'version'     => $theme_info->info['version'] ?? '1.0',
    ]);
    $response->headers->set('Access-Control-Allow-Origin', '*');
    $response->headers->set('Cache-Control', 'no-store');
    return $response;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Concatenates CSS files declared in the active theme's libraries.
   */
  private function collectThemeCss(): string {
    $theme_name = \Drupal::service('theme.manager')->getActiveTheme()->getName();
    $theme_path = \Drupal::root() . '/' . \Drupal::service('extension.list.theme')->getPath($theme_name);

    $library_discovery = \Drupal::service('library.discovery');
    $libraries = $library_discovery->getLibrariesByExtension($theme_name);

    $css_parts = [];
    foreach ($libraries as $library) {
      if (empty($library['css'])) continue;
      foreach ($library['css'] as $group) {
        foreach ($group as $file => $options) {
          // Skip external/CDN files (start with http or //)
          if (str_starts_with($file, 'http') || str_starts_with($file, '//')) continue;
          $full_path = $theme_path . '/' . $file;
          if (file_exists($full_path)) {
            $css_parts[] = '/* === ' . basename($file) . ' === */';
            $css_parts[] = file_get_contents($full_path);
          }
        }
      }
    }

    return implode("\n\n", $css_parts);
  }

  /**
   * Concatenates JS files declared in the active theme's libraries.
   */
  private function collectThemeJs(): string {
    $theme_name = \Drupal::service('theme.manager')->getActiveTheme()->getName();
    $theme_path = \Drupal::root() . '/' . \Drupal::service('extension.list.theme')->getPath($theme_name);

    $library_discovery = \Drupal::service('library.discovery');
    $libraries = $library_discovery->getLibrariesByExtension($theme_name);

    $js_parts = [];
    foreach ($libraries as $library) {
      if (empty($library['js'])) continue;
      foreach ($library['js'] as $file => $options) {
        if (str_starts_with($file, 'http') || str_starts_with($file, '//')) continue;
        if (!empty($options['minified'])) continue; // skip already-minified vendor files
        $full_path = $theme_path . '/' . $file;
        if (file_exists($full_path)) {
          $js_parts[] = '// === ' . basename($file) . ' ===';
          $js_parts[] = file_get_contents($full_path);
        }
      }
    }

    return implode("\n\n", $js_parts);
  }

  /**
   * Detects the design system from theme base theme or library dependencies.
   *
   * Returns 'bootstrap', 'uswds', or 'custom'.
   */
  private function detectThemeSystem($theme_info): string {
    $base_theme = $theme_info->info['base theme'] ?? '';
    $name       = $theme_info->getName();

    // Check theme name and base theme for known design systems
    $bootstrap_signals = ['bootstrap', 'bootstrap5', 'dxpr_theme'];
    $uswds_signals     = ['uswds', 'uswds_base'];

    foreach ($bootstrap_signals as $signal) {
      if (str_contains(strtolower($name), $signal) || str_contains(strtolower($base_theme), $signal)) {
        return 'bootstrap';
      }
    }

    foreach ($uswds_signals as $signal) {
      if (str_contains(strtolower($name), $signal) || str_contains(strtolower($base_theme), $signal)) {
        return 'uswds';
      }
    }

    return 'custom';
  }

}
