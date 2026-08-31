import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolves @repo/ui to its TypeScript source instead of dist, so editing a
    // component hot-reloads here with no build step in between. tsconfig `paths`
    // keeps the typechecker pointed at the same files.
    conditions: ['@repo/source'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
