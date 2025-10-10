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
  },
});
