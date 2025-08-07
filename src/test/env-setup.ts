// Load test environment variables BEFORE any other imports
import dotenv from "dotenv";

// Set NODE_ENV to test
process.env.NODE_ENV = "test";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// Ensure we're using the test database URL
process.env.DATABASE_URL = "postgresql://postgres:ASKsome123!@localhost:5432/funnel_builder_test";

console.log("Environment Setup: NODE_ENV =", process.env.NODE_ENV);
console.log("Environment Setup: REDIS_DB =", process.env.REDIS_DB);