import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { getTestDatabase, TestDatabase } from "./test-database";
import { TestFactory } from "./test-factories";
import { redisService } from "../services/cache/redis.service";

// Import all services that need Prisma client injection
import { setPrismaClient as setAuthPrismaClient } from "../services/auth.service";
import { setPrismaClient as setUserPrismaClient } from "../services/user.service";
import { setPrismaClient as setFunnelPrismaClient } from "../services/funnel";
import { setPrismaClient as setPagePrismaClient } from "../services/page";
import { setPrismaClient as setDomainPrismaClient } from "../services/domain.service";
import { setPrismaClient as setThemePrismaClient } from "../services/theme.service";

// Test database and factory instances
let testDatabase: TestDatabase;
let testFactory: TestFactory;

// Export for use in tests
export let testPrisma: ReturnType<TestDatabase["getPrismaClient"]>;
export { testFactory };

beforeAll(async () => {
  console.log("Test Setup: NODE_ENV =", process.env.NODE_ENV);
  console.log("Test Setup: CI =", process.env.CI || "false");

  try {
    // Initialize test database
    testDatabase = getTestDatabase();
    await testDatabase.setup();
    
    // Get Prisma client from test database
    testPrisma = testDatabase.getPrismaClient();
    
    // Initialize test factory
    testFactory = new TestFactory(testPrisma);
    
    // Inject test Prisma client into all services
    setAuthPrismaClient(testPrisma);
    setUserPrismaClient(testPrisma);
    setFunnelPrismaClient(testPrisma);
    setPagePrismaClient(testPrisma);
    setDomainPrismaClient(testPrisma);
    setThemePrismaClient(testPrisma);

    // Connect to Redis
    await redisService.connect();
  } catch (error) {
    console.error("Test setup failed:", error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await testDatabase.teardown();
    await redisService.disconnect();
  } catch (error) {
    console.error("Test teardown failed:", error);
  }
});

beforeEach(async () => {
  try {
    await redisService.flush();
  } catch (error) {
    console.warn("Redis flush error:", error);
  }
});

afterEach(async () => {
  try {
    // Clean database after each test
    await testDatabase.clean();
  } catch (error) {
    console.warn("Database cleanup error:", error);
  }
});
