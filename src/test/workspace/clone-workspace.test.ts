import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { getPrisma, setPrismaClient } from "../../lib/prisma";
import { PrismaClient } from "../../generated/prisma-client";
import { CloneWorkspaceService } from "../../services/workspace/clone-workspace";

// Mock Cloudflare API calls for workspace subdomains
// Note: Workspace subdomains use WORKSPACE_ZONE_ID (for digitalsite.com)
// The createARecord utility is mocked to avoid real Cloudflare API calls during tests
vi.mock("../../services/domain/create-subdomain/utils/create-a-record", () => ({
  createARecord: vi.fn().mockResolvedValue({
    id: "mock-cloudflare-record-id",
    type: "A",
    name: "test",
    content: "74.234.194.84",
  }),
}));

/**
 * Integration tests for Clone Workspace Service
 * Tests the complete workspace cloning flow with real database
 * Following TDD approach - write tests first, then implementation
 */
describe("CloneWorkspaceService.cloneWorkspace - Integration Tests", () => {
  // Initialize Prisma for test environment
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  // Test data IDs
  let sellerUserId: number;
  let buyerUserId: number;
  let sourceWorkspaceId: number;
  let testPaymentTransactionId: string;
  let funnelId1: number;
  let funnelId2: number;
  let pageId1: number;
  let pageId2: number;
  let pageId3: number;
  let roleTemplateId: number;

  const testTimestamp = Date.now();
  const sellerEmail = `seller-${testTimestamp}@example.com`;
  const buyerEmail = `buyer-${testTimestamp}@example.com`;
  const workspaceSlug = `test-workspace-${testTimestamp}`;

  beforeAll(async () => {
    // Verify we're using the test database
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(`\n🔧 Running clone workspace tests against database: ${dbName}\n`);

    // Create seller user (workspace owner)
    const seller = await prisma.user.create({
      data: {
        email: sellerEmail,
        username: `seller${testTimestamp}`,
        firstName: "Seller",
        lastName: "User",
        password: "hashed-password",
        plan: "AGENCY",
        verified: true,
        commissionPercentage: 20,
      },
    });
    sellerUserId = seller.id;

    // Create buyer user
    const buyer = await prisma.user.create({
      data: {
        email: buyerEmail,
        username: `buyer${testTimestamp}`,
        firstName: "Buyer",
        lastName: "User",
        password: "hashed-password",
        plan: "BUSINESS",
        verified: true,
      },
    });
    buyerUserId = buyer.id;

    // Create source workspace with content
    const sourceWorkspace = await prisma.workspace.create({
      data: {
        name: "Premium Templates Workspace",
        slug: workspaceSlug,
        ownerId: sellerUserId,
        planType: "AGENCY",
        status: "ACTIVE",
        description: "A workspace full of premium templates",
        settings: JSON.stringify({ theme: "dark", notifications: true }),
        image: "https://example.com/workspace-image.jpg",
      },
    });
    sourceWorkspaceId = sourceWorkspace.id;

    // Create role permission template
    const roleTemplate = await prisma.workspaceRolePermTemplate.create({
      data: {
        workspaceId: sourceWorkspaceId,
        role: "ADMIN",
        permissions: ["CREATE_FUNNELS", "EDIT_FUNNELS", "DELETE_FUNNELS"],
      },
    });
    roleTemplateId = roleTemplate.id;

    // Create theme for funnel1
    const theme1 = await prisma.theme.create({
      data: {
        name: "Sales Theme",
        backgroundColor: "#ffffff",
        textColor: "#000000",
        buttonColor: "#0066cc",
        buttonTextColor: "#ffffff",
        borderColor: "#cccccc",
        optionColor: "#0066cc",
        fontFamily: "Arial",
        borderRadius: "ROUNDED",
        type: "CUSTOM",
      },
    });

    // Create first funnel with pages
    const funnel1 = await prisma.funnel.create({
      data: {
        name: "Sales Funnel",
        slug: "sales-funnel",
        status: "LIVE",
        workspaceId: sourceWorkspaceId,
        createdBy: sellerUserId,
        activeThemeId: theme1.id,
      },
    });
    funnelId1 = funnel1.id;

    // Update theme to link to funnel
    await prisma.theme.update({
      where: { id: theme1.id },
      data: { funnelId: funnel1.id },
    });

    // Create funnel settings for funnel1
    await prisma.funnelSettings.create({
      data: {
        funnelId: funnelId1,
        defaultSeoTitle: "Sales Funnel SEO",
        defaultSeoDescription: "Best sales funnel",
        googleAnalyticsId: "UA-12345",
        isPasswordProtected: true,
        passwordHash: "should-not-be-copied",
      },
    });

    // Create pages for funnel1
    const page1 = await prisma.page.create({
      data: {
        name: "Landing Page",
        content: "<h1>Welcome</h1>",
        order: 0,
        linkingId: "landing",
        funnelId: funnelId1,
      },
    });
    pageId1 = page1.id;

    const page2 = await prisma.page.create({
      data: {
        name: "Thank You Page",
        content: "<h1>Thanks</h1>",
        order: 1,
        linkingId: "thanks",
        funnelId: funnelId1,
      },
    });
    pageId2 = page2.id;

    // Create theme for funnel2
    const theme2 = await prisma.theme.create({
      data: {
        name: "Lead Theme",
        backgroundColor: "#f0f0f0",
        textColor: "#333333",
        buttonColor: "#ff6600",
        buttonTextColor: "#ffffff",
        borderColor: "#dddddd",
        optionColor: "#ff6600",
        fontFamily: "Helvetica",
        borderRadius: "SOFT",
        type: "CUSTOM",
      },
    });

    // Create second funnel with one page
    const funnel2 = await prisma.funnel.create({
      data: {
        name: "Lead Magnet",
        slug: "lead-magnet",
        status: "DRAFT",
        workspaceId: sourceWorkspaceId,
        createdBy: sellerUserId,
        activeThemeId: theme2.id,
      },
    });
    funnelId2 = funnel2.id;

    // Update theme to link to funnel
    await prisma.theme.update({
      where: { id: theme2.id },
      data: { funnelId: funnel2.id },
    });

    const page3 = await prisma.page.create({
      data: {
        name: "Opt-in Page",
        content: "<h1>Get Free Guide</h1>",
        order: 0,
        linkingId: "optin",
        funnelId: funnelId2,
      },
    });
    pageId3 = page3.id;

    // Create a payment record
    const payment = await prisma.payment.create({
      data: {
        transactionId: `CLONE-TEST-${testTimestamp}`,
        amount: 99.99,
        currency: "USD",
        status: "captured",
        itemType: "BUSINESS",
        paymentType: "WORKSPACE_PURCHASE",
        buyerId: buyerUserId,
        workspaceId: sourceWorkspaceId,
      },
    });
    testPaymentTransactionId = payment.transactionId;
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.workspaceClone.deleteMany({
      where: {
        OR: [{ sellerId: sellerUserId }, { buyerId: buyerUserId }],
      },
    });

    await prisma.page.deleteMany({
      where: {
        funnel: {
          workspace: {
            ownerId: { in: [sellerUserId, buyerUserId] },
          },
        },
      },
    });

    await prisma.funnelSettings.deleteMany({
      where: {
        funnel: {
          workspace: {
            ownerId: { in: [sellerUserId, buyerUserId] },
          },
        },
      },
    });

    await prisma.funnel.deleteMany({
      where: {
        workspace: {
          ownerId: { in: [sellerUserId, buyerUserId] },
        },
      },
    });

    await prisma.workspaceRolePermTemplate.deleteMany({
      where: {
        workspace: {
          ownerId: { in: [sellerUserId, buyerUserId] },
        },
      },
    });

    await prisma.payment.deleteMany({
      where: { buyerId: buyerUserId },
    });

    await prisma.workspace.deleteMany({
      where: { ownerId: { in: [sellerUserId, buyerUserId] } },
    });

    await prisma.user.deleteMany({
      where: { id: { in: [sellerUserId, buyerUserId] } },
    });

    await prismaClient.$disconnect();
  });

  describe("Validation Tests", () => {
    it("should reject if payment not found", async () => {
      await expect(
        CloneWorkspaceService.cloneWorkspace({
          sourceWorkspaceId: sourceWorkspaceId,
          newOwnerId: buyerUserId,
          paymentId: "999999", // Non-existent payment (string format)
          planType: "BUSINESS",
        })
      ).rejects.toThrow(/couldn't find a payment/i);
    });

    it("should reject if payment already used for cloning", async () => {
      // First clone should succeed
      await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPaymentTransactionId,
        planType: "BUSINESS",
      });

      // Second attempt with same payment should fail
      await expect(
        CloneWorkspaceService.cloneWorkspace({
          sourceWorkspaceId: sourceWorkspaceId,
          newOwnerId: buyerUserId,
          paymentId: testPaymentTransactionId,
          planType: "BUSINESS",
        })
      ).rejects.toThrow(/payment.*already.*used/i);
    });

    it("should reject if source workspace not found", async () => {
      // Create a new payment for this test
      const newPayment = await prisma.payment.create({
        data: {
          transactionId: `TEST-INVALID-WS-${Date.now()}`,
          amount: 99.99,
          currency: "USD",
          status: "captured",
          itemType: "BUSINESS",
          paymentType: "WORKSPACE_PURCHASE",
          buyerId: buyerUserId,
        },
      });

      await expect(
        CloneWorkspaceService.cloneWorkspace({
          sourceWorkspaceId: 999999, // Non-existent workspace
          newOwnerId: buyerUserId,
          paymentId: newPayment.transactionId,
          planType: "BUSINESS",
        })
      ).rejects.toThrow(/workspace.*not found/i);

      // Clean up
      await prisma.payment.delete({ where: { id: newPayment.id } });
    });

    it("should reject if new owner not found", async () => {
      // Create a new payment for this test
      const newPayment = await prisma.payment.create({
        data: {
          transactionId: `TEST-INVALID-OWNER-${Date.now()}`,
          amount: 99.99,
          currency: "USD",
          status: "captured",
          itemType: "BUSINESS",
          paymentType: "WORKSPACE_PURCHASE",
          buyerId: buyerUserId,
        },
      });

      await expect(
        CloneWorkspaceService.cloneWorkspace({
          sourceWorkspaceId: sourceWorkspaceId,
          newOwnerId: 999999, // Non-existent user
          paymentId: newPayment.transactionId,
          planType: "BUSINESS",
        })
      ).rejects.toThrow(/owner.*not found/i);

      // Clean up
      await prisma.payment.delete({ where: { id: newPayment.id } });
    });
  });

  describe("Workspace Cloning Tests", () => {
    let clonedWorkspaceId: number;

    beforeEach(async () => {
      // Clean up any existing clones before each test
      await prisma.workspaceClone.deleteMany({
        where: { buyerId: buyerUserId },
      });

      await prisma.workspace.deleteMany({
        where: { ownerId: buyerUserId },
      });
    });

    it("should create workspace with unique slug", async () => {
      // Create a new payment for this test
      const newPayment = await prisma.payment.create({
        data: {
          transactionId: `TEST-UNIQUE-SLUG-${Date.now()}`,
          amount: 99.99,
          currency: "USD",
          status: "captured",
          itemType: "BUSINESS",
          paymentType: "WORKSPACE_PURCHASE",
          buyerId: buyerUserId,
        },
      });

      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: newPayment.transactionId,
        planType: "BUSINESS",
      });

      // Slug should be based on buyer's username (buyer{timestamp})
      expect(result.clonedWorkspace.slug).toMatch(/^buyer\d+(-\d+)?$/);
      expect(result.clonedWorkspace.slug).not.toBe(workspaceSlug);

      clonedWorkspaceId = result.clonedWorkspaceId;

      // Clean up
      await prisma.workspaceClone.deleteMany({
        where: { clonedWorkspaceId: clonedWorkspaceId },
      });
      await prisma.workspace.delete({ where: { id: clonedWorkspaceId } });
      await prisma.payment.delete({ where: { id: newPayment.id } });
    });

    it("should copy workspace properties correctly", async () => {
      // Create a new payment for this test
      const newPayment = await prisma.payment.create({
        data: {
          transactionId: `TEST-PROPERTIES-${Date.now()}`,
          amount: 99.99,
          currency: "USD",
          status: "captured",
          itemType: "BUSINESS",
          paymentType: "WORKSPACE_PURCHASE",
          buyerId: buyerUserId,
        },
      });

      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: newPayment.transactionId,
        planType: "BUSINESS",
      });

      const clonedWorkspace = await prisma.workspace.findUnique({
        where: { id: result.clonedWorkspaceId },
      });

      expect(clonedWorkspace).toBeDefined();
      expect(clonedWorkspace!.name).toBe("Premium Templates Workspace");
      expect(clonedWorkspace!.description).toBe("A workspace full of premium templates");
      expect(clonedWorkspace!.image).toBe("https://example.com/workspace-image.jpg");
      expect(clonedWorkspace!.settings).toEqual(
        JSON.stringify({ theme: "dark", notifications: true })
      );
      expect(clonedWorkspace!.ownerId).toBe(buyerUserId);
      expect(clonedWorkspace!.planType).toBe("BUSINESS");
      expect(clonedWorkspace!.status).toBe("ACTIVE");

      clonedWorkspaceId = result.clonedWorkspaceId;

      // Clean up
      await prisma.workspaceClone.deleteMany({
        where: { clonedWorkspaceId: clonedWorkspaceId },
      });
      await prisma.workspace.delete({ where: { id: clonedWorkspaceId } });
      await prisma.payment.delete({ where: { id: newPayment.id } });
    });

    it("should generate incremental slugs for multiple clones", async () => {
      // Create first clone
      const payment1 = await prisma.payment.create({
        data: {
          transactionId: `TEST-SLUG-1-${Date.now()}`,
          amount: 99.99,
          currency: "USD",
          status: "captured",
          itemType: "BUSINESS",
          paymentType: "WORKSPACE_PURCHASE",
          buyerId: buyerUserId,
        },
      });

      const result1 = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: payment1.transactionId,
        planType: "BUSINESS",
      });

      // Create second clone
      const payment2 = await prisma.payment.create({
        data: {
          transactionId: `TEST-SLUG-2-${Date.now()}`,
          amount: 99.99,
          currency: "USD",
          status: "captured",
          itemType: "BUSINESS",
          paymentType: "WORKSPACE_PURCHASE",
          buyerId: buyerUserId,
        },
      });

      const result2 = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: payment2.transactionId,
        planType: "BUSINESS",
      });

      // Both should be based on buyer's username (buyer{timestamp})
      expect(result1.clonedWorkspace.slug).toMatch(/^buyer\d+(-\d+)?$/);
      expect(result2.clonedWorkspace.slug).toMatch(/^buyer\d+(-\d+)?$/);
      expect(result1.clonedWorkspace.slug).not.toBe(result2.clonedWorkspace.slug);

      // Second clone should have incremental number (-2, -3, etc.)
      expect(result2.clonedWorkspace.slug).toMatch(/-\d+$/); // Should end with -2, -3, etc.

      // Clean up
      await prisma.workspaceClone.deleteMany({
        where: {
          clonedWorkspaceId: { in: [result1.clonedWorkspaceId, result2.clonedWorkspaceId] },
        },
      });
      await prisma.workspace.deleteMany({
        where: { id: { in: [result1.clonedWorkspaceId, result2.clonedWorkspaceId] } },
      });
      await prisma.payment.deleteMany({
        where: { id: { in: [payment1.id, payment2.id] } },
      });
    });
  });

  describe("Funnel Cloning Tests", () => {
    let clonedWorkspaceId: number;
    let testPayment: { id: number; transactionId: string };

    beforeEach(async () => {
      // Clean up before each test
      await prisma.workspaceClone.deleteMany({
        where: { buyerId: buyerUserId },
      });

      await prisma.workspace.deleteMany({
        where: { ownerId: buyerUserId },
      });

      // Create a fresh payment for each test
      const payment = await prisma.payment.create({
        data: {
          transactionId: `TEST-FUNNEL-${Date.now()}`,
          amount: 99.99,
          currency: "USD",
          status: "captured",
          itemType: "BUSINESS",
          paymentType: "WORKSPACE_PURCHASE",
          buyerId: buyerUserId,
        },
      });
      testPayment = payment;
    });

    afterEach(async () => {
      // Clean up after each test
      if (clonedWorkspaceId) {
        await prisma.workspaceClone.deleteMany({
          where: { clonedWorkspaceId },
        });
        await prisma.workspace.delete({ where: { id: clonedWorkspaceId } });
      }
      if (testPayment) {
        await prisma.payment.delete({ where: { id: testPayment.id } });
      }
    });

    it("should copy all funnels from source workspace", async () => {
      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      const clonedFunnels = await prisma.funnel.findMany({
        where: { workspaceId: clonedWorkspaceId },
        orderBy: { name: "asc" },
      });

      expect(clonedFunnels).toHaveLength(2);
      expect(clonedFunnels[0].name).toBe("Lead Magnet");
      expect(clonedFunnels[1].name).toBe("Sales Funnel");
      expect(clonedFunnels[0].createdBy).toBe(buyerUserId);
      expect(clonedFunnels[1].createdBy).toBe(buyerUserId);
    });

    it("should copy all pages for each funnel", async () => {
      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      const clonedFunnels = await prisma.funnel.findMany({
        where: { workspaceId: clonedWorkspaceId },
        include: { pages: { orderBy: { order: "asc" } } },
      });

      const salesFunnel = clonedFunnels.find((f) => f.name === "Sales Funnel");
      const leadMagnet = clonedFunnels.find((f) => f.name === "Lead Magnet");

      expect(salesFunnel!.pages).toHaveLength(2);
      expect(salesFunnel!.pages[0].name).toBe("Landing Page");
      expect(salesFunnel!.pages[0].content).toBe("<h1>Welcome</h1>");
      expect(salesFunnel!.pages[1].name).toBe("Thank You Page");

      expect(leadMagnet!.pages).toHaveLength(1);
      expect(leadMagnet!.pages[0].name).toBe("Opt-in Page");
    });

    it("should preserve page order", async () => {
      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      const clonedFunnels = await prisma.funnel.findMany({
        where: { workspaceId: clonedWorkspaceId, name: "Sales Funnel" },
        include: { pages: { orderBy: { order: "asc" } } },
      });

      const pages = clonedFunnels[0].pages;
      expect(pages[0].order).toBe(0);
      expect(pages[1].order).toBe(1);
      expect(pages[0].linkingId).toBe("landing");
      expect(pages[1].linkingId).toBe("thanks");
    });

    it("should copy funnel settings and clear tracking IDs", async () => {
      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      const salesFunnel = await prisma.funnel.findFirst({
        where: { workspaceId: clonedWorkspaceId, name: "Sales Funnel" },
        include: { settings: true },
      });

      expect(salesFunnel!.settings).toBeDefined();
      expect(salesFunnel!.settings!.defaultSeoTitle).toBe("Sales Funnel SEO");
      expect(salesFunnel!.settings!.googleAnalyticsId).toBeNull(); // CLEARED
      expect(salesFunnel!.settings!.facebookPixelId).toBeNull(); // CLEARED
    });

    it("should remove password protection for BUSINESS plan workspaces", async () => {
      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS", // BUSINESS plan
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      const salesFunnel = await prisma.funnel.findFirst({
        where: { workspaceId: clonedWorkspaceId, name: "Sales Funnel" },
        include: { settings: true },
      });

      expect(salesFunnel!.settings!.isPasswordProtected).toBe(false);
      expect(salesFunnel!.settings!.passwordHash).toBeNull();
    });

    it("should preserve password protection for AGENCY plan workspaces", async () => {
      // Create a new payment for AGENCY plan test
      const agencyPayment = await prisma.payment.create({
        data: {
          transactionId: `TEST-AGENCY-${Date.now()}`,
          amount: 199.99,
          currency: "USD",
          status: "captured",
          itemType: "AGENCY",
          paymentType: "WORKSPACE_PURCHASE",
          buyerId: buyerUserId,
        },
      });

      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: agencyPayment.transactionId,
        planType: "AGENCY", // AGENCY plan keeps password
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      const salesFunnel = await prisma.funnel.findFirst({
        where: { workspaceId: clonedWorkspaceId, name: "Sales Funnel" },
        include: { settings: true },
      });

      expect(salesFunnel!.settings!.isPasswordProtected).toBe(true);
      expect(salesFunnel!.settings!.passwordHash).toBe("should-not-be-copied");

      // Clean up manually (this test uses different payment)
      await prisma.workspaceClone.deleteMany({
        where: { clonedWorkspaceId },
      });
      await prisma.workspace.delete({ where: { id: clonedWorkspaceId } });
      await prisma.payment.delete({ where: { id: agencyPayment.id } });

      // Prevent afterEach from trying to delete again
      clonedWorkspaceId = 0;
    });

    it("should reset page visits to 0 for all pages", async () => {
      // First, add some visits to source pages
      await prisma.page.update({
        where: { id: pageId1 },
        data: { visits: 100 },
      });

      await prisma.page.update({
        where: { id: pageId2 },
        data: { visits: 250 },
      });

      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      const clonedPages = await prisma.page.findMany({
        where: {
          funnel: { workspaceId: clonedWorkspaceId },
        },
      });

      // All cloned pages should have 0 visits
      clonedPages.forEach((page) => {
        expect(page.visits).toBe(0);
      });

      // Verify source pages still have visits
      const sourcePage1 = await prisma.page.findUnique({
        where: { id: pageId1 },
      });
      expect(sourcePage1!.visits).toBe(100);
    });

    it("should duplicate CUSTOM themes from funnels", async () => {
      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      const clonedFunnels = await prisma.funnel.findMany({
        where: { workspaceId: clonedWorkspaceId },
        include: { activeTheme: true },
      });

      // Each funnel should have its own duplicated CUSTOM theme
      clonedFunnels.forEach((funnel) => {
        expect(funnel.activeTheme).toBeDefined();
        expect(funnel.activeTheme!.type).toBe("CUSTOM");
        expect(funnel.activeTheme!.funnelId).toBe(funnel.id);
      });

      // Verify themes were duplicated (different IDs from source)
      const sourceFunnels = await prisma.funnel.findMany({
        where: { workspaceId: sourceWorkspaceId },
        include: { activeTheme: true },
      });

      clonedFunnels.forEach((clonedFunnel, index) => {
        expect(clonedFunnel.activeTheme!.id).not.toBe(
          sourceFunnels[index].activeTheme!.id
        );
      });
    });

    it("should share GLOBAL themes between source and cloned funnels", async () => {
      // Create a GLOBAL theme
      const globalTheme = await prisma.theme.create({
        data: {
          name: "Global Theme",
          backgroundColor: "#000000",
          textColor: "#ffffff",
          buttonColor: "#ff0000",
          buttonTextColor: "#ffffff",
          borderColor: "#333333",
          optionColor: "#ff0000",
          fontFamily: "Roboto",
          borderRadius: "NONE",
          type: "GLOBAL",
          funnelId: null,
        },
      });

      // Create a funnel with GLOBAL theme
      const globalFunnel = await prisma.funnel.create({
        data: {
          name: "Global Theme Funnel",
          slug: "global-theme-funnel",
          status: "DRAFT",
          workspaceId: sourceWorkspaceId,
          createdBy: sellerUserId,
          activeThemeId: globalTheme.id,
        },
      });

      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      // Find the cloned funnel
      const clonedGlobalFunnel = await prisma.funnel.findFirst({
        where: {
          workspaceId: clonedWorkspaceId,
          name: "Global Theme Funnel",
        },
        include: { activeTheme: true },
      });

      // Should use the SAME theme ID (shared, not duplicated)
      expect(clonedGlobalFunnel!.activeThemeId).toBe(globalTheme.id);
      expect(clonedGlobalFunnel!.activeTheme!.type).toBe("GLOBAL");
      expect(clonedGlobalFunnel!.activeTheme!.funnelId).toBeNull();

      // Clean up
      await prisma.funnel.delete({ where: { id: globalFunnel.id } });
    });

    it("should NOT copy domain connections", async () => {
      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      const clonedFunnels = await prisma.funnel.findMany({
        where: { workspaceId: clonedWorkspaceId },
        include: { domainConnections: true },
      });

      // No funnels should have domain connections
      clonedFunnels.forEach((funnel) => {
        expect(funnel.domainConnections).toHaveLength(0);
      });
    });

    it("should keep same funnel name and slug (no conflicts across workspaces)", async () => {
      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      const clonedFunnels = await prisma.funnel.findMany({
        where: { workspaceId: clonedWorkspaceId },
        orderBy: { name: "asc" },
      });

      // Should have same names and slugs as source
      expect(clonedFunnels[0].name).toBe("Lead Magnet");
      expect(clonedFunnels[0].slug).toBe("lead-magnet");
      expect(clonedFunnels[1].name).toBe("Sales Funnel");
      expect(clonedFunnels[1].slug).toBe("sales-funnel");

      // Verify source funnels still exist unchanged
      const sourceFunnels = await prisma.funnel.findMany({
        where: { workspaceId: sourceWorkspaceId },
      });
      expect(sourceFunnels).toHaveLength(2);
    });
  });

  describe("Role Template Tests", () => {
    let clonedWorkspaceId: number;
    let testPayment: { id: number; transactionId: string };

    beforeEach(async () => {
      // Clean up before each test
      await prisma.workspaceClone.deleteMany({
        where: { buyerId: buyerUserId },
      });

      await prisma.workspace.deleteMany({
        where: { ownerId: buyerUserId },
      });

      // Create a fresh payment
      const payment = await prisma.payment.create({
        data: {
          transactionId: `TEST-ROLE-${Date.now()}`,
          amount: 99.99,
          currency: "USD",
          status: "captured",
          itemType: "BUSINESS",
          paymentType: "WORKSPACE_PURCHASE",
          buyerId: buyerUserId,
        },
      });
      testPayment = payment;
    });

    afterEach(async () => {
      if (clonedWorkspaceId) {
        await prisma.workspaceClone.deleteMany({
          where: { clonedWorkspaceId },
        });
        await prisma.workspace.delete({ where: { id: clonedWorkspaceId } });
      }
      if (testPayment) {
        await prisma.payment.delete({ where: { id: testPayment.id } });
      }
    });

    it("should copy workspace role permission templates", async () => {
      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      const roleTemplates = await prisma.workspaceRolePermTemplate.findMany({
        where: { workspaceId: clonedWorkspaceId },
      });

      expect(roleTemplates).toHaveLength(1);
      expect(roleTemplates[0].role).toBe("ADMIN");
      expect(roleTemplates[0].permissions).toEqual([
        "CREATE_FUNNELS",
        "EDIT_FUNNELS",
        "DELETE_FUNNELS",
      ]);
    });
  });

  describe("WorkspaceClone Record Tests", () => {
    let clonedWorkspaceId: number;
    let testPayment: { id: number; transactionId: string };

    beforeEach(async () => {
      await prisma.workspaceClone.deleteMany({
        where: { buyerId: buyerUserId },
      });

      await prisma.workspace.deleteMany({
        where: { ownerId: buyerUserId },
      });

      const payment = await prisma.payment.create({
        data: {
          transactionId: `TEST-RECORD-${Date.now()}`,
          amount: 99.99,
          currency: "USD",
          status: "captured",
          itemType: "BUSINESS",
          paymentType: "WORKSPACE_PURCHASE",
          buyerId: buyerUserId,
        },
      });
      testPayment = payment;
    });

    afterEach(async () => {
      if (clonedWorkspaceId) {
        await prisma.workspaceClone.deleteMany({
          where: { clonedWorkspaceId },
        });
        await prisma.workspace.delete({ where: { id: clonedWorkspaceId } });
      }
      if (testPayment) {
        await prisma.payment.delete({ where: { id: testPayment.id } });
      }
    });

    it("should create WorkspaceClone tracking record", async () => {
      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      const cloneRecord = await prisma.workspaceClone.findUnique({
        where: { paymentId: testPayment.id },
      });

      expect(cloneRecord).toBeDefined();
      expect(cloneRecord!.sourceWorkspaceId).toBe(sourceWorkspaceId);
      expect(cloneRecord!.clonedWorkspaceId).toBe(result.clonedWorkspaceId);
      expect(cloneRecord!.sellerId).toBe(sellerUserId);
      expect(cloneRecord!.buyerId).toBe(buyerUserId);
      expect(cloneRecord!.paymentId).toBe(testPayment.id);
    });
  });

  describe("Success Tests", () => {
    let clonedWorkspaceId: number;
    let testPayment: { id: number; transactionId: string };

    beforeEach(async () => {
      await prisma.workspaceClone.deleteMany({
        where: { buyerId: buyerUserId },
      });

      await prisma.workspace.deleteMany({
        where: { ownerId: buyerUserId },
      });

      const payment = await prisma.payment.create({
        data: {
          transactionId: `TEST-SUCCESS-${Date.now()}`,
          amount: 99.99,
          currency: "USD",
          status: "captured",
          itemType: "BUSINESS",
          paymentType: "WORKSPACE_PURCHASE",
          buyerId: buyerUserId,
        },
      });
      testPayment = payment;
    });

    afterEach(async () => {
      if (clonedWorkspaceId) {
        await prisma.workspaceClone.deleteMany({
          where: { clonedWorkspaceId },
        });
        await prisma.workspace.delete({ where: { id: clonedWorkspaceId } });
      }
      if (testPayment) {
        await prisma.payment.delete({ where: { id: testPayment.id } });
      }
    });

    it("should complete full clone successfully", async () => {
      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      expect(result.message).toMatch(/successfully/i);
      expect(result.clonedWorkspaceId).toBeGreaterThan(0);
      expect(result.clonedWorkspace.id).toBe(result.clonedWorkspaceId);
      expect(result.clonedWorkspace.planType).toBe("BUSINESS");
      expect(result.cloneRecordId).toBeGreaterThan(0);

      // Verify source workspace is unchanged
      const sourceWorkspace = await prisma.workspace.findUnique({
        where: { id: sourceWorkspaceId },
        include: { funnels: true },
      });

      expect(sourceWorkspace!.ownerId).toBe(sellerUserId);
      expect(sourceWorkspace!.funnels).toHaveLength(2);
    });

    it("should return correct response structure", async () => {
      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("clonedWorkspaceId");
      expect(result).toHaveProperty("clonedWorkspace");
      expect(result).toHaveProperty("cloneRecordId");
      expect(result.clonedWorkspace).toHaveProperty("id");
      expect(result.clonedWorkspace).toHaveProperty("name");
      expect(result.clonedWorkspace).toHaveProperty("slug");
      expect(result.clonedWorkspace).toHaveProperty("planType");
    });

    it("should create workspace subdomain on digitalsite.com (not associated to avoid consuming allocation)", async () => {
      // Clone a workspace
      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      // Verify workspace was created
      const clonedWorkspace = await prisma.workspace.findUnique({
        where: { id: result.clonedWorkspaceId },
      });

      expect(clonedWorkspace).toBeTruthy();

      // Find the subdomain in domains table (not associated with workspace)
      const workspaceSubdomain = await prisma.domain.findFirst({
        where: {
          hostname: `${clonedWorkspace!.slug}.digitalsite.com`,
          createdBy: buyerUserId,
        },
      });

      expect(workspaceSubdomain).toBeTruthy();
      expect(workspaceSubdomain!.hostname).toBe(
        `${clonedWorkspace!.slug}.digitalsite.com`
      );
      expect(workspaceSubdomain!.status).toBe("ACTIVE");
      expect(workspaceSubdomain!.sslStatus).toBe("ACTIVE");
      expect(workspaceSubdomain!.workspaceId).toBeNull(); // NOT associated with workspace
      expect(workspaceSubdomain!.createdBy).toBe(buyerUserId);
    });

    it("should create subdomain based on buyer's username", async () => {
      // Clone workspace
      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: testPayment.transactionId,
        planType: "BUSINESS",
      });

      clonedWorkspaceId = result.clonedWorkspaceId;

      // Get buyer's username to verify slug naming
      const buyer = await prisma.user.findUnique({
        where: { id: buyerUserId },
        select: { username: true },
      });

      // Verify workspace has subdomain with correct format
      const clonedWorkspace = await prisma.workspace.findUnique({
        where: { id: result.clonedWorkspaceId },
      });

      expect(clonedWorkspace).toBeTruthy();

      // Verify slug is based on username (buyer{timestamp})
      expect(clonedWorkspace!.slug).toMatch(/^buyer\d+(-\d+)?$/);

      // Find the workspace subdomain (not associated with workspace)
      const workspaceSubdomain = await prisma.domain.findFirst({
        where: {
          hostname: `${clonedWorkspace!.slug}.digitalsite.com`,
          createdBy: buyerUserId,
        },
      });

      expect(workspaceSubdomain).toBeTruthy();

      // Subdomain should be based on buyer's username
      const expectedPattern = new RegExp(`^buyer\\d+(-\\d+)?\\.digitalsite\\.com$`);
      expect(workspaceSubdomain!.hostname).toMatch(expectedPattern);

      // Should match: buyer{timestamp}.digitalsite.com or buyer{timestamp}-2.digitalsite.com, etc.
      expect(workspaceSubdomain!.hostname).toBe(
        `${clonedWorkspace!.slug}.digitalsite.com`
      );

      // Verify subdomain properties
      expect(workspaceSubdomain!.status).toBe("ACTIVE");
      expect(workspaceSubdomain!.sslStatus).toBe("ACTIVE");
      expect(workspaceSubdomain!.workspaceId).toBeNull(); // NOT associated with workspace
      expect(workspaceSubdomain!.createdBy).toBe(buyerUserId);
    });

    it("should create workspace member for new owner with OWNER role", async () => {
      // Create a new payment for this test
      const newPayment = await prisma.payment.create({
        data: {
          transactionId: `TEST-MEMBER-${Date.now()}`,
          amount: 99.99,
          currency: "USD",
          status: "captured",
          itemType: "BUSINESS",
          paymentType: "WORKSPACE_PURCHASE",
          buyerId: buyerUserId,
        },
      });

      const result = await CloneWorkspaceService.cloneWorkspace({
        sourceWorkspaceId: sourceWorkspaceId,
        newOwnerId: buyerUserId,
        paymentId: newPayment.transactionId,
        planType: "BUSINESS",
      });

      // Verify workspace member was created for the new owner
      const workspaceMember = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: result.clonedWorkspaceId,
          userId: buyerUserId,
        },
      });

      expect(workspaceMember).toBeDefined();
      expect(workspaceMember!.role).toBe("OWNER");
      expect(workspaceMember!.status).toBe("ACTIVE");

      // Verify owner has all permissions
      expect(workspaceMember!.permissions).toContain("MANAGE_WORKSPACE");
      expect(workspaceMember!.permissions).toContain("MANAGE_MEMBERS");
      expect(workspaceMember!.permissions).toContain("CREATE_FUNNELS");
      expect(workspaceMember!.permissions).toContain("EDIT_FUNNELS");
      expect(workspaceMember!.permissions).toContain("EDIT_PAGES");
      expect(workspaceMember!.permissions).toContain("DELETE_FUNNELS");
      expect(workspaceMember!.permissions).toContain("VIEW_ANALYTICS");
      expect(workspaceMember!.permissions).toContain("MANAGE_DOMAINS");
      expect(workspaceMember!.permissions).toContain("CREATE_DOMAINS");
      expect(workspaceMember!.permissions).toContain("DELETE_DOMAINS");
      expect(workspaceMember!.permissions).toContain("CONNECT_DOMAINS");

      // Clean up
      await prisma.workspaceMember.deleteMany({
        where: { workspaceId: result.clonedWorkspaceId },
      });
      await prisma.workspaceClone.deleteMany({
        where: { clonedWorkspaceId: result.clonedWorkspaceId },
      });
      await prisma.workspace.delete({ where: { id: result.clonedWorkspaceId } });
      await prisma.payment.delete({ where: { id: newPayment.id } });

      // Prevent afterEach from trying to delete again
      clonedWorkspaceId = 0;
    });
  });
});
