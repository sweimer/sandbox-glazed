
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hudx': path.resolve(__dirname, '../css'),
      '@hudxjs': path.resolve(__dirname, '../js'),
    },
  },
});
