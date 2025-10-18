import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { Request, Response } from "express";
import { getPrisma, setPrismaClient } from "../../lib/prisma";
import { PrismaClient } from "../../generated/prisma-client";
import { CreateAddonPaymentLinkController } from "../../controllers/payment/create-addon-payment-link";

describe("CreateAddonPaymentLinkController.createAddonPaymentLink - Integration Tests", () => {
  // Initialize Prisma for test environment
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  let testUserId: number;
  let testBusinessWorkspaceId: number;
  let testBusinessWorkspaceSlug: string;
  let testAgencyWorkspaceId: number;
  let testAgencyWorkspaceSlug: string;
  let testOtherUserId: number;

  // Mock Express request and response
  const mockRequest = (body: any, userId?: number): Partial<Request> => {
    const req: any = {
      body,
    };

    // Set userId if provided (simulates authenticateToken middleware)
    if (userId !== undefined) {
      req.userId = userId;
    }

    return req;
  };

  const mockResponse = (): Partial<Response> => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = vi.fn();

  beforeAll(async () => {
    // Verify we're using the test database
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(
      `\n🔧 Running addon payment tests against database: ${dbName}\n`
    );

    // Set required environment variables
    process.env.FRONTEND_URL = "https://testsite.com";
    process.env.MAMOPAY_API_URL = "https://sandbox.dev.business.mamopay.com";
    process.env.MAMOPAY_API_KEY = "test-mamopay-key";

    // Create test user with BUSINESS plan
    const user = await prisma.user.create({
      data: {
        email: `addon-test-user-${Date.now()}@example.com`,
        username: `addonuser${Date.now()}`,
        firstName: "Addon",
        lastName: "Tester",
        password: "hashed-password",
        plan: "BUSINESS",
        verified: true,
      },
    });
    testUserId = user.id;

    // Create another user (for permission tests)
    const otherUser = await prisma.user.create({
      data: {
        email: `other-user-${Date.now()}@example.com`,
        username: `otheruser${Date.now()}`,
        firstName: "Other",
        lastName: "User",
        password: "hashed-password",
        plan: "BUSINESS",
        verified: true,
      },
    });
    testOtherUserId = otherUser.id;

    // Create BUSINESS workspace
    testBusinessWorkspaceSlug = `business-workspace-${Date.now()}`;
    const businessWorkspace = await prisma.workspace.create({
      data: {
        name: "Business Workspace",
        slug: testBusinessWorkspaceSlug,
        ownerId: testUserId,
        planType: "BUSINESS",
        status: "ACTIVE",
      },
    });
    testBusinessWorkspaceId = businessWorkspace.id;

    // Create AGENCY workspace
    testAgencyWorkspaceSlug = `agency-workspace-${Date.now()}`;
    const agencyWorkspace = await prisma.workspace.create({
      data: {
        name: "Agency Workspace",
        slug: testAgencyWorkspaceSlug,
        ownerId: testUserId,
        planType: "AGENCY",
        status: "ACTIVE",
      },
    });
    testAgencyWorkspaceId = agencyWorkspace.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.workspace.deleteMany({
      where: { ownerId: { in: [testUserId, testOtherUserId] } },
    });

    await prisma.user.deleteMany({
      where: { id: { in: [testUserId, testOtherUserId] } },
    });

    await prismaClient.$disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Workspace-Level Addons - BUSINESS Workspace", () => {
    it("should create payment link for EXTRA_ADMIN addon", async () => {
      const req = mockRequest(
        {
          
          addonType: "EXTRA_ADMIN",
          workspaceSlug: testBusinessWorkspaceSlug,
        },
        testUserId
      );
      const res = mockResponse();

      // Mock MamoPay API response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "mamopay_addon_123",
          link_url: "https://mamopay.com/pay/addon123",
          payment_url: "https://mamopay.com/checkout/addon123",
          title: "Extra Team Member",
          description:
            "Add an additional team member to your Business workspace",
          amount: 10, // $10/month for BUSINESS
          amount_currency: "USD",
          active: true,
          created_date: new Date().toISOString(),
        }),
      });

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();

      const responseData = (res.json as any).mock.calls[0][0];
      expect(responseData.message).toBe(
        "Add-on payment link created successfully"
      );
      expect(responseData.paymentLink.addonType).toBe("EXTRA_ADMIN");
      expect(responseData.paymentLink.amount).toBe(10);
    });

    it("should create payment link for EXTRA_FUNNEL addon", async () => {
      const req = mockRequest(
        {
          
          addonType: "EXTRA_FUNNEL",
          workspaceSlug: testBusinessWorkspaceSlug,
        },
        testUserId
      );
      const res = mockResponse();

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "mamopay_addon_124",
          link_url: "https://mamopay.com/pay/addon124",
          payment_url: "https://mamopay.com/checkout/addon124",
          title: "Extra Funnel",
          description: "Add an additional funnel to your Business workspace",
          amount: 15,
          amount_currency: "USD",
          active: true,
          created_date: new Date().toISOString(),
        }),
      });

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = (res.json as any).mock.calls[0][0];
      expect(responseData.paymentLink.addonType).toBe("EXTRA_FUNNEL");
      expect(responseData.paymentLink.amount).toBe(15);
    });

    it("should create payment link for EXTRA_SUBDOMAIN addon", async () => {
      const req = mockRequest(
        {
          addonType: "EXTRA_SUBDOMAIN",
          workspaceSlug: testBusinessWorkspaceSlug,
        },
        testUserId
      );
      const res = mockResponse();

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "mamopay_addon_126",
          link_url: "https://mamopay.com/pay/addon126",
          payment_url: "https://mamopay.com/checkout/addon126",
          title: "Extra Subdomain",
          description:
            "Add an additional subdomain to your Business workspace",
          amount: 3,
          amount_currency: "USD",
          active: true,
          created_date: new Date().toISOString(),
        }),
      });

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = (res.json as any).mock.calls[0][0];
      expect(responseData.paymentLink.addonType).toBe("EXTRA_SUBDOMAIN");
      expect(responseData.paymentLink.amount).toBe(3);
    });

    it("should create payment link for EXTRA_CUSTOM_DOMAIN addon", async () => {
      const req = mockRequest(
        {
          addonType: "EXTRA_CUSTOM_DOMAIN",
          workspaceSlug: testBusinessWorkspaceSlug,
        },
        testUserId
      );
      const res = mockResponse();

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "mamopay_addon_127",
          link_url: "https://mamopay.com/pay/addon127",
          payment_url: "https://mamopay.com/checkout/addon127",
          title: "Extra Custom Domain",
          description:
            "Add an additional custom domain to your Business workspace",
          amount: 10,
          amount_currency: "USD",
          active: true,
          created_date: new Date().toISOString(),
        }),
      });

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = (res.json as any).mock.calls[0][0];
      expect(responseData.paymentLink.addonType).toBe("EXTRA_CUSTOM_DOMAIN");
      expect(responseData.paymentLink.amount).toBe(10);
    });
  });

  describe("Workspace-Level Addons - AGENCY Workspace", () => {
    it("should allow EXTRA_ADMIN for AGENCY workspace", async () => {
      const req = mockRequest(
        {
          
          addonType: "EXTRA_ADMIN",
          workspaceSlug: testAgencyWorkspaceSlug,
        },
        testUserId
      );
      const res = mockResponse();

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "mamopay_addon_127",
          link_url: "https://mamopay.com/pay/addon127",
          payment_url: "https://mamopay.com/checkout/addon127",
          title: "Extra Team Member",
          description: "Add an additional team member to your Agency workspace",
          amount: 5, // $5/month for AGENCY
          amount_currency: "USD",
          active: true,
          created_date: new Date().toISOString(),
        }),
      });

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = (res.json as any).mock.calls[0][0];
      expect(responseData.paymentLink.addonType).toBe("EXTRA_ADMIN");
      expect(responseData.paymentLink.amount).toBe(5); // AGENCY pricing
    });

    it("should reject EXTRA_FUNNEL for AGENCY workspace", async () => {
      const req = mockRequest(
        {
          
          addonType: "EXTRA_FUNNEL",
          workspaceSlug: testAgencyWorkspaceSlug,
        },
        testUserId
      );
      const res = mockResponse();

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toMatch(/not available for your workspace/i);
    });

    it("should reject EXTRA_PAGE for AGENCY workspace", async () => {
      const req = mockRequest(
        {
          
          addonType: "EXTRA_PAGE",
          workspaceSlug: testAgencyWorkspaceSlug,
        },
        testUserId
      );
      const res = mockResponse();

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toMatch(/not available for your workspace/i);
    });

    it("should reject EXTRA_SUBDOMAIN for AGENCY workspace", async () => {
      const req = mockRequest(
        {
          addonType: "EXTRA_SUBDOMAIN",
          workspaceSlug: testAgencyWorkspaceSlug,
        },
        testUserId
      );
      const res = mockResponse();

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toMatch(/not available for your workspace/i);
    });

    it("should reject EXTRA_CUSTOM_DOMAIN for AGENCY workspace", async () => {
      const req = mockRequest(
        {
          addonType: "EXTRA_CUSTOM_DOMAIN",
          workspaceSlug: testAgencyWorkspaceSlug,
        },
        testUserId
      );
      const res = mockResponse();

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toMatch(/not available for your workspace/i);
    });
  });

  describe("User-Level Addons", () => {
    it("should create payment link for EXTRA_WORKSPACE addon", async () => {
      const req = mockRequest(
        {
          
          addonType: "EXTRA_WORKSPACE",
          // No workspaceId for user-level addon
        },
        testUserId
      );
      const res = mockResponse();

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "mamopay_addon_128",
          link_url: "https://mamopay.com/pay/addon128",
          payment_url: "https://mamopay.com/checkout/addon128",
          title: "Extra Workspace",
          description:
            "Add an additional workspace slot to your Business account",
          amount: 25,
          amount_currency: "USD",
          active: true,
          created_date: new Date().toISOString(),
        }),
      });

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(res.status).toHaveBeenCalledWith(200);
      const responseData = (res.json as any).mock.calls[0][0];
      expect(responseData.paymentLink.addonType).toBe("EXTRA_WORKSPACE");
      expect(responseData.paymentLink.amount).toBe(25);
    });

    it("should reject EXTRA_WORKSPACE with workspaceSlug", async () => {
      const req = mockRequest(
        {

          addonType: "EXTRA_WORKSPACE",
          workspaceSlug: testBusinessWorkspaceSlug, // Should not provide workspaceSlug
        },
        testUserId
      );
      const res = mockResponse();

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toMatch(/should not be provided for user-level/i);
    });

    it("should reject EXTRA_WORKSPACE for AGENCY users (unlimited workspaces)", async () => {
      // Create an AGENCY user
      const agencyUser = await prisma.user.create({
        data: {
          email: `agency-user-${Date.now()}@example.com`,
          username: `agencyuser${Date.now()}`,
          firstName: "Agency",
          lastName: "User",
          password: "hashed-password",
          plan: "AGENCY", // AGENCY plan has unlimited workspaces
          verified: true,
        },
      });

      const req = mockRequest(
        {
          addonType: "EXTRA_WORKSPACE",
        },
        agencyUser.id
      );
      const res = mockResponse();

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toMatch(/unlimited workspaces/i);

      // Cleanup
      await prisma.user.delete({ where: { id: agencyUser.id } });
    });
  });

  describe("Validation Tests", () => {
    it("should reject workspace addon without workspaceSlug", async () => {
      const req = mockRequest(
        {

          addonType: "EXTRA_FUNNEL",
          // Missing workspaceSlug
        },
        testUserId
      );
      const res = mockResponse();

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toMatch(/Workspace slug is required/i);
    });

    it("should reject if workspace not found", async () => {
      const req = mockRequest(
        {
          
          addonType: "EXTRA_FUNNEL",
          workspaceSlug: "non-existent-workspace", // Non-existent workspace
        },
        testUserId
      );
      const res = mockResponse();

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toMatch(
        /Workspace not found or you don't have permission/i
      );
    });

    it("should reject if user doesn't own workspace", async () => {
      const req = mockRequest(
        {
          
          addonType: "EXTRA_FUNNEL",
          workspaceSlug: testBusinessWorkspaceSlug, // Owned by testUserId
        },
        testOtherUserId // Different user
      );
      const res = mockResponse();

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toMatch(/don't have permission/i);
    });

    it("should reject if user is not verified", async () => {
      // Create unverified user
      const unverifiedUser = await prisma.user.create({
        data: {
          email: `unverified-${Date.now()}@example.com`,
          username: `unverified${Date.now()}`,
          firstName: "Unverified",
          lastName: "User",
          password: "hashed-password",
          plan: "BUSINESS",
          verified: false, // Not verified
        },
      });

      const req = mockRequest(
        {
          
          addonType: "EXTRA_WORKSPACE",
        },
        unverifiedUser.id
      );
      const res = mockResponse();

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toMatch(/verify your email/i);

      // Cleanup
      await prisma.user.delete({ where: { id: unverifiedUser.id } });
    });

    

    
  });

  describe("MamoPay API Error Handling", () => {
    it("should handle MamoPay API failure", async () => {
      const req = mockRequest(
        {
          
          addonType: "EXTRA_FUNNEL",
          workspaceSlug: testBusinessWorkspaceSlug,
        },
        testUserId
      );
      const res = mockResponse();

      // Mock MamoPay API error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Invalid request",
      });

      await CreateAddonPaymentLinkController.createAddonPaymentLink(
        req as Request,
        res as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toMatch(/Payment link creation failed/i);
    });
  });
});
