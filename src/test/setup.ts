import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "../generated/prisma-client";
import { redisService } from "../services/cache/redis.service";

// Import all services that need Prisma client injection
import { setPrismaClient as setAuthPrismaClient } from "../services/auth.service";
import { setPrismaClient as setUserPrismaClient } from "../services/user.service";
import { setPrismaClient as setFunnelPrismaClient } from "../services/funnel";
import { setPrismaClient as setPagePrismaClient } from "../services/page";
import { setPrismaClient as setDomainPrismaClient } from "../services/domain.service";
import { setPrismaClient as setThemePrismaClient } from "../services/theme.service";

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function clearDatabase() {
  await testPrisma.funnelDomain.deleteMany();
  await testPrisma.page.deleteMany();
  await testPrisma.domain.deleteMany();
  await testPrisma.funnel.deleteMany();
  await testPrisma.user.deleteMany();
}

beforeAll(async () => {
  console.log(
    "Test Setup: Using database",
    process.env.DATABASE_URL?.split("@")[1] || "Not set"
  );
  console.log("Test Setup: NODE_ENV =", process.env.NODE_ENV);

  try {
    // Inject test Prisma client into all services
    setAuthPrismaClient(testPrisma);
    setUserPrismaClient(testPrisma);
    setFunnelPrismaClient(testPrisma);
    setPagePrismaClient(testPrisma);
    setDomainPrismaClient(testPrisma);
    setThemePrismaClient(testPrisma);

    await clearDatabase();
    await redisService.connect();
  } catch (error) {
    console.warn("Setup error:", error);
  }
});

afterAll(async () => {
  await testPrisma.$disconnect();
  try {
    await redisService.disconnect();
  } catch (error) {
    console.warn("Redis cleanup error:", error);
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
    await clearDatabase();
  } catch (error) {
    console.warn("Database cleanup error:", error);
  }
});
