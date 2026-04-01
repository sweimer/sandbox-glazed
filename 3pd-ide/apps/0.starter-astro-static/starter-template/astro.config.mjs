import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env so we can read PUBLIC_DRUPAL_BASE_URL for the dev proxy.
// The proxy is only active during `astro dev` — ignored during `astro build`.
const env = loadEnv('development', process.cwd(), '');
const drupalProxyTarget = env.PUBLIC_DRUPAL_BASE_URL || null;

export default defineConfig({
  vite: {
    server: {
      // Dev proxy — routes /drupal-proxy/* to Drupal server-side, bypassing CORS.
      // In production the app runs inside Drupal (same origin) so no proxy is needed.
      // In src/pages/*.astro use: import.meta.env.DEV ? '/drupal-proxy' : ''
      proxy: drupalProxyTarget ? {
        '/drupal-proxy': {
          target: drupalProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/drupal-proxy/, ''),
        },
      } : {},
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),

        // ---------------------------------------------------------
        // HUDX GLOBAL ASSETS — same convention as React starter
        // ---------------------------------------------------------
        '@hudx':   path.resolve(__dirname, '../../starter-scripts/hudx-global/css'),
        '@hudxjs': path.resolve(__dirname, '../../starter-scripts/hudx-global/js'),
      },
    },
  },
});
