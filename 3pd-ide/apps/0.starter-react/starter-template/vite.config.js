
import { defineConfig, loadEnv } from 'vite';
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

export default defineConfig(({ mode }) => {
  // loadEnv reads .env (and .env.local, .env.[mode]) into a plain object.
  // The '' prefix loads ALL vars, not just VITE_ prefixed ones — needed for DEV_PORT.
  const env = loadEnv(mode, process.cwd(), '');

  // Drupal proxy — dev only. Routes /drupal-proxy/* → VITE_DRUPAL_BASE_URL/* server-side,
  // avoiding CORS. In production the app runs inside Drupal (same-origin) so no proxy needed.
  const drupalProxyTarget = env.VITE_DRUPAL_BASE_URL || null;

  return {
  server: {
    port: parseInt(env.DEV_PORT) || 5173,
    strictPort: true, // fail loudly if port taken — don't silently use wrong port
    proxy: drupalProxyTarget ? {
      '/drupal-proxy': {
        target: drupalProxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/drupal-proxy/, ''),
      },
    } : {},
  },
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
  };
});
