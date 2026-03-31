
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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
