import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import path from "path";

// Load .env.test BEFORE any tests run (override=true to replace existing vars)
const envPath = path.resolve(__dirname, ".env.test");
const result = config({ path: envPath, override: true });

// Verify .env.test was loaded successfully
if (result.error) {
  console.error('\n❌ ERROR: Failed to load .env.test file');
  console.error('Path attempted:', envPath);
  console.error('Error:', result.error.message);
  process.exit(1);
}

// Note: Safety checks are run in setupFiles (see below)
// This avoids issues with esbuild during config loading

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // CRITICAL: Run safety checks before any test files load
    setupFiles: ['./src/test/test-safety-guard.ts'],
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
