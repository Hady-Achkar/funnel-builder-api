import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import path from "path";

// Load .env.test for test environment (override=true to replace existing vars)
config({ path: path.resolve(__dirname, ".env.test"), override: true });

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: [],
    // Increase timeout for integration tests with real database
    testTimeout: 10000,
    hookTimeout: 10000,
    // Run tests serially to avoid database conflicts
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Alternative: set maxConcurrency to 1 to run tests one at a time
    maxConcurrency: 1,
    // Run test files sequentially
    fileParallelism: false,
  },
});
