import { describe, it, expect, beforeEach } from "vitest";
import { testPrisma } from "./setup";
import { TestHelpers } from "./helpers";
import { FunnelStatus } from "../generated/prisma-client";

describe("Example Test Suite - New Test Setup", () => {
  let testUserId: number;

  beforeEach(async () => {
    // Create a test user for this suite
    const user = await TestHelpers.createTestUser({
      email: "example@test.com",
      name: "Example User",
    });
    testUserId = user.id;
  });

  describe("Using Test Helpers", () => {
    it("should create a user with funnels and pages", async () => {
      // Create a funnel with pages
      const funnel = await TestHelpers.createTestFunnel(testUserId, {
        name: "My Test Funnel",
        status: FunnelStatus.DRAFT,
      });

      // Create pages for the funnel
      const page1 = await TestHelpers.createTestPage(funnel.id, {
        name: "Landing Page",
        content: "<h1>Welcome</h1>",
        order: 0,
      });

      const page2 = await TestHelpers.createTestPage(funnel.id, {
        name: "Thank You Page",
        content: "<h1>Thank You</h1>",
        order: 1,
      });

      // Verify the data was created
      const savedFunnel = await testPrisma.funnel.findUnique({
        where: { id: funnel.id },
        include: { pages: true },
      });

      expect(savedFunnel).toBeDefined();
      expect(savedFunnel?.pages).toHaveLength(2);
      expect(savedFunnel?.pages[0].name).toBe("Landing Page");
      expect(savedFunnel?.pages[1].name).toBe("Thank You Page");
    });

    it("should create domain and connect to funnel", async () => {
      // Create funnel and domain
      const funnel = await TestHelpers.createTestFunnel(testUserId);
      const domain = await TestHelpers.createTestDomain(testUserId, {
        hostname: "example.com",
      });

      // Connect them
      await testPrisma.funnelDomain.create({
        data: {
          funnelId: funnel.id,
          domainId: domain.id,
          isActive: true,
        },
      });

      // Verify connection
      const connection = await testPrisma.funnelDomain.findFirst({
        where: {
          funnelId: funnel.id,
          domainId: domain.id,
        },
      });

      expect(connection).toBeDefined();
      expect(connection?.isActive).toBe(true);
    });
  });

  describe("Using TestHelpers", () => {
    it("should work with existing TestHelpers methods", async () => {
      // These use the test factory under the hood
      const funnel = await TestHelpers.createTestFunnel(testUserId, {
        name: "Helper Funnel",
      });

      const domain = await TestHelpers.createTestDomain(testUserId, {
        hostname: "helper.example.com",
      });

      expect(funnel.name).toBe("Helper Funnel");
      expect(domain.hostname).toBe("helper.example.com");
    });
  });

  describe("Transaction Support", () => {
    it("should rollback changes in transaction test", async () => {
      // Count users before test
      const userCountBefore = await testPrisma.user.count();

      // Run test in transaction (will be rolled back)
      await TestHelpers.runInTransaction(async (tx) => {
        await tx.user.create({
          data: {
            email: "transaction@test.com",
            name: "Transaction User",
            password: "hashed",
          },
        });

        // Inside transaction, user exists
        const userInTx = await tx.user.findUnique({
          where: { email: "transaction@test.com" },
        });
        expect(userInTx).toBeDefined();
      });

      // After transaction, user count should be same
      const userCountAfter = await testPrisma.user.count();
      expect(userCountAfter).toBe(userCountBefore);

      // User should not exist outside transaction
      const user = await testPrisma.user.findUnique({
        where: { email: "transaction@test.com" },
      });
      expect(user).toBeNull();
    });
  });

  describe("Bulk Operations", () => {
    it("should create multiple users with funnels", async () => {
      // Create 3 users with funnels
      const users = [];
      for (let i = 0; i < 3; i++) {
        const user = await TestHelpers.createTestUser({
          email: `bulk-user-${i}@example.com`,
          name: `Bulk User ${i}`,
        });
        
        // Create 2 funnels per user
        for (let j = 0; j < 2; j++) {
          const funnel = await TestHelpers.createTestFunnel(user.id, {
            name: `User ${i} Funnel ${j}`,
          });
          
          // Create 3 pages per funnel
          for (let k = 0; k < 3; k++) {
            await TestHelpers.createTestPage(funnel.id, {
              name: `Page ${k}`,
              order: k,
            });
          }
        }
        
        users.push(user);
      }

      expect(users).toHaveLength(3);

      // Verify each user has 2 funnels
      for (const user of users) {
        const funnels = await testPrisma.funnel.findMany({
          where: { userId: user.id },
          include: { pages: true },
        });

        expect(funnels).toHaveLength(2);
        
        // Each funnel should have 3 pages
        for (const funnel of funnels) {
          expect(funnel.pages).toHaveLength(3);
        }
      }
    });
  });

  describe("Cleanup", () => {
    it("should properly clean up user and related data", async () => {
      // Create user with related data
      const user = await TestHelpers.createTestUser();
      const funnel = await TestHelpers.createTestFunnel(user.id);
      await TestHelpers.createTestPage(funnel.id);
      await TestHelpers.createTestDomain(user.id);

      // Clean up user
      await TestHelpers.cleanupUser(user.id);

      // Verify all related data is deleted
      const userExists = await testPrisma.user.findUnique({
        where: { id: user.id },
      });
      const funnelExists = await testPrisma.funnel.findUnique({
        where: { id: funnel.id },
      });

      expect(userExists).toBeNull();
      expect(funnelExists).toBeNull();
    });
  });
});