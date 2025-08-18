// Load test environment variables BEFORE any other imports
import dotenv from "dotenv";
import path from "path";

// Set NODE_ENV to test
process.env.NODE_ENV = "test";

// Load test environment variables
const envPath = path.resolve(process.cwd(), ".env.test");
dotenv.config({ path: envPath });

// Set test database URL based on environment
if (!process.env.DATABASE_URL) {
  // Check if running in CI
  if (process.env.CI === "true") {
    process.env.DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/funnel_builder_test";
  } else {
    // Local development
    process.env.DATABASE_URL =
      "postgresql://postgres:ASKsome123!@localhost:5432/funnel_builder_test";
  }
}

// Set Redis URL if not set
if (!process.env.REDIS_URL) {
  process.env.REDIS_URL = "redis://localhost:6379";
}

// Set Redis DB for tests
if (!process.env.REDIS_DB) {
  process.env.REDIS_DB = "1";
}

// Set JWT secret for tests if not set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-secret-key-for-testing-only";
}

console.log("Environment Setup: NODE_ENV =", process.env.NODE_ENV);
console.log("Environment Setup: CI =", process.env.CI || "false");
console.log(
  "Environment Setup: Database =",
  process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "Not set"
);
console.log("Environment Setup: Redis DB =", process.env.REDIS_DB || "0");
