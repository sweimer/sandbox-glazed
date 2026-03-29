import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),

        // ---------------------------------------------------------
        // HUDX GLOBAL ASSETS — same convention as React starter
        // NOTE: these paths resolve correctly inside the monorepo.
        // When this starter moves to a standalone repo, bundle
        // hudx-global into the starter-template instead.
        // ---------------------------------------------------------
        '@hudx':   path.resolve(__dirname, '../../starter-scripts/hudx-global/css'),
        '@hudxjs': path.resolve(__dirname, '../../starter-scripts/hudx-global/js'),
      },
    },
  },
});
