import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./setup/env.ts'],
    include: ['unit/**/*.test.ts', 'integration/**/*.test.ts', 'security/**/*.test.ts'],
    fileParallelism: false,
    coverage: {
      enabled: false,
    },
  },
});
