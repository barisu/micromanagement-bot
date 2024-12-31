import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
config();

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './vitest.setup.ts',
    testTimeout: 30000,
  },
});
