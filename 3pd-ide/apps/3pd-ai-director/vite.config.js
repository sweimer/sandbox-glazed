import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hudx': path.resolve(__dirname, '../../starter-scripts/hudx-global/css'),
      '@hudxjs': path.resolve(__dirname, '../../starter-scripts/hudx-global/js'),
    },
  },
});
