import { defineConfig } from 'vitest/config';

export default defineConfig({
  poolOptions: {
    threads: {
      singleThread: true, // Run tests sequentially to avoid DB conflicts
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
