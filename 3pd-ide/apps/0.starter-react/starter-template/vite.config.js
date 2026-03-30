
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * drupalDevStyles — dev server only (apply: 'serve')
 *
 * Injects Bootstrap Icons (CDN) and the local drupal-dev-styles.css into the
 * page during `npm run dev`. Skipped entirely during `vite build`, so these
 * stylesheets are never included in the Drupal module output.
 *
 * Generate drupal-dev-styles.css by running: 3pd styles sync
 */
function drupalDevAssets() {
  return {
    name: 'vite-plugin-drupal-dev-assets',
    apply: 'serve',
    transformIndexHtml(html) {
      const links = [
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.min.css" />',
        '<link rel="stylesheet" href="/drupal-dev-styles.css" />',
      ].join('\n    ');
      return html
        .replace('</head>', `    ${links}\n  </head>`)
        .replace('</body>', `  <script src="/drupal-dev-scripts.js"></script>\n</body>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), drupalDevAssets()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),

      // ---------------------------------------------------------
      // UPDATED PATHS FOR HUDX GLOBAL ASSETS
      // ---------------------------------------------------------
      '@hudx': path.resolve(__dirname, '../../starter-scripts/hudx-global/css'),
      '@hudxjs': path.resolve(__dirname, '../../starter-scripts/hudx-global/js'),
    },
  },
});
