import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit tests for pure logic (node environment, no DOM). `@/` mirrors the
// tsconfig path alias. next-intl's ESM build imports `next/*` without a file
// extension, which plain Node ESM cannot resolve, so Vite inlines it.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    server: { deps: { inline: ['next-intl'] } },
  },
});
