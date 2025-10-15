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
import jwt from "jsonwebtoken";
import { getPrisma, setPrismaClient } from "../../lib/prisma";
import { PrismaClient } from "../../generated/prisma-client";
import { CreatePaymentLinkController } from "../../controllers/payment/create-payment-link";

/**
 * Integration tests for Generic Payment Link Creation
 *
 * What this service does:
 * 1. Validates request data
 * 2. Checks buyer email doesn't exist
 * 3. Decodes affiliate JWT (if provided)
 * 4. Validates workspace (if WORKSPACE_PURCHASE)
 * 5. Builds MamoPay payload with custom_data
 * 6. Calls MamoPay API
 * 7. Returns payment link
 *
 * What it does NOT do:
 * - Does NOT create Payment records (webhook does this)
 * - Does NOT create User accounts (webhook does this)
 * - Does NOT create Subscriptions (webhook does this)
 */
describe("CreatePaymentLinkController.createPaymentLink - Integration Tests", () => {
  // Initialize Prisma for test environment
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  let testSellerId: number;
  let testAgencyWorkspaceId: number;
  let testBusinessWorkspaceId: number;
  let testAffiliateLinkId: number;
  let testAffiliateToken: string;
  let businessAffiliateToken: string;

  // Mock Express request and response
  const mockRequest = (body: any, userId?: number): Partial<Request> =>
    ({
      body,
      userId,
    } as any);

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
    console.log(`\n🔧 Running tests against database: ${dbName}\n`);

    // Set required environment variables
    process.env.JWT_SECRET = "test-secret-key-for-payment-links";
    process.env.FRONTEND_URL = "https://testsite.com";
    process.env.MAMOPAY_API_URL = "https://sandbox.dev.business.mamopay.com";
    process.env.MAMOPAY_API_KEY = "test-mamopay-key";

    // Create a test seller user
    const seller = await prisma.user.create({
      data: {
        email: `seller-${Date.now()}@example.com`,
        username: `seller${Date.now()}`,
        firstName: "Test",
        lastName: "Seller",
        password: "hashed-password",
        plan: "BUSINESS",
        verified: true,
        commissionPercentage: 15,
      },
    });
    testSellerId = seller.id;

    // Create AGENCY workspace (can be sold)
    const agencyWorkspace = await prisma.workspace.create({
      data: {
        name: "Premium Agency Workspace",
        slug: `agency-workspace-${Date.now()}`,
        ownerId: testSellerId,
        planType: "AGENCY",
        status: "ACTIVE",
      },
    });
    testAgencyWorkspaceId = agencyWorkspace.id;

    // Create BUSINESS workspace (cannot be sold - for validation tests)
    const businessWorkspace = await prisma.workspace.create({
      data: {
        name: "Business Workspace",
        slug: `business-workspace-${Date.now()}`,
        ownerId: testSellerId,
        planType: "BUSINESS",
        status: "ACTIVE",
      },
    });
    testBusinessWorkspaceId = businessWorkspace.id;

    // Create affiliate link for AGENCY workspace
    const affiliateLink = await prisma.affiliateLink.create({
      data: {
        name: "Agency Workspace Sale Link",
        token: "",
        itemType: "AGENCY",
        userId: testSellerId,
        workspaceId: testAgencyWorkspaceId,
        settings: {},
      },
    });
    testAffiliateLinkId = affiliateLink.id;

    // Generate JWT for AGENCY workspace
    testAffiliateToken = jwt.sign(
      {
        userId: testSellerId,
        workspaceId: testAgencyWorkspaceId,
        name: "Agency Workspace Sale Link",
        planType: "AGENCY",
        commissionPercentage: 15,
        settings: {},
        affiliateLinkId: testAffiliateLinkId,
      },
      process.env.JWT_SECRET!
    );

    // Update affiliate link with token
    await prisma.affiliateLink.update({
      where: { id: testAffiliateLinkId },
      data: { token: testAffiliateToken },
    });

    // Create affiliate link for BUSINESS workspace (for rejection tests)
    const businessAffiliateLink = await prisma.affiliateLink.create({
      data: {
        name: "Business Workspace Link",
        token: "",
        itemType: "BUSINESS",
        userId: testSellerId,
        workspaceId: testBusinessWorkspaceId,
        settings: {},
      },
    });

    businessAffiliateToken = jwt.sign(
      {
        userId: testSellerId,
        workspaceId: testBusinessWorkspaceId,
        name: "Business Workspace Link",
        planType: "BUSINESS",
        commissionPercentage: 15,
        settings: {},
        affiliateLinkId: businessAffiliateLink.id,
      },
      process.env.JWT_SECRET!
    );

    await prisma.affiliateLink.update({
      where: { id: businessAffiliateLink.id },
      data: { token: businessAffiliateToken },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.affiliateLink.deleteMany({
      where: { userId: testSellerId },
    });

    await prisma.workspace.deleteMany({
      where: { ownerId: testSellerId },
    });

    await prisma.user.deleteMany({
      where: { id: testSellerId },
    });

    await prismaClient.$disconnect();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe(
    "PLAN_PURCHASE - No Affiliate",
    () => {
      it("should create payment link with all required fields in custom_data.details", async () => {
        // Arrange
        const buyerEmail = `buyer-plan-${Date.now()}@example.com`;
        const req = mockRequest(
          {
            firstName: "John",
            lastName: "Doe",
            email: buyerEmail,
            paymentType: "PLAN_PURCHASE",
            planType: "BUSINESS",
            planTitle: "Business Plan - Monthly",
            planDescription: "Full access to business features",
            amount: 99.99,
            frequency: "monthly",
            frequencyInterval: 1,
            freeTrialPeriodInDays: 14,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
          },
          testSellerId
        );
        const res = mockResponse();

        // Mock MamoPay API response
        global.fetch = vi.fn().mockResolvedValue(
          {
            ok: true,
            json: async () => ({
              id: "mamopay_link_123",
              link_url: "https://mamopay.com/pay/abc123",
              payment_url: "https://mamopay.com/checkout/abc123",
              title: "Business Plan - Monthly",
              description: "Full access to business features",
              amount: 99.99,
              amount_currency: "USD",
              active: true,
              created_date: new Date().toISOString(),
            }),
          },
          testSellerId
        );

        // Act
        await CreatePaymentLinkController.createPaymentLink(
          req as Request,
          res as Response,
          mockNext
        );

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalled();

        const responseData = (res.json as any).mock.calls[0][0];
        expect(responseData.message).toBe("Payment link created successfully");
        expect(responseData.paymentLink).toMatchObject(
          {
            url: "https://mamopay.com/pay/abc123",
            amount: 99.99,
            frequency: "monthly",
            frequencyInterval: 1,
            trialPeriodDays: 14,
            planType: "BUSINESS",
          },
          testSellerId
        );

        // Verify MamoPay was called with correct custom_data structure
        const mamoPayCall = (global.fetch as any).mock.calls[0];
        const payload = JSON.parse(mamoPayCall[1].body);

        expect(payload.custom_data.details).toMatchObject(
          {
            firstName: "John",
            lastName: "Doe",
            email: buyerEmail,
            planType: "BUSINESS",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
            trialDays: 14,
          },
          testSellerId
        );

        // Should NOT have affiliate data
        expect(payload.custom_data.affiliateLink).toBeUndefined();

        // Should NOT have removed fields
        expect(payload.custom_data.details.funnels).toBeUndefined();
        expect(payload.custom_data.details.subdomains).toBeUndefined();
        expect(payload.custom_data.details.customDomains).toBeUndefined();
        expect(payload.custom_data.details.admins).toBeUndefined();
      });

      it("should use default values (monthly, interval 1, trial 0)", async () => {
        // Arrange
        const req = mockRequest(
          {
            firstName: "Jane",
            lastName: "Smith",
            email: `buyer-defaults-${Date.now()}@example.com`,
            paymentType: "PLAN_PURCHASE",
            planType: "AGENCY",
            planTitle: "Agency Plan",
            planDescription: "Premium features",
            amount: 199.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
            // NOT providing: frequency, frequencyInterval, freeTrialPeriodInDays
          },
          testSellerId
        );
        const res = mockResponse();

        global.fetch = vi.fn().mockResolvedValue(
          {
            ok: true,
            json: async () => ({
              id: "mamopay_defaults",
              link_url: "https://mamopay.com/pay/defaults",
              payment_url: "https://mamopay.com/checkout/defaults",
              title: "Agency Plan",
              description: "Premium features",
              amount: 199.99,
              amount_currency: "USD",
              active: true,
              created_date: new Date().toISOString(),
            }),
          },
          testSellerId
        );

        // Act
        await CreatePaymentLinkController.createPaymentLink(
          req as Request,
          res as Response,
          mockNext
        );

        // Assert
        const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
        expect(payload.custom_data.details).toMatchObject(
          {
            frequency: "monthly", // Default
            frequencyInterval: 1, // Default
            trialDays: 0, // Default
          },
          testSellerId
        );

        const responseData = (res.json as any).mock.calls[0][0];
        expect(responseData.paymentLink).toMatchObject(
          {
            frequency: "monthly",
            frequencyInterval: 1,
            trialPeriodDays: 0,
          },
          testSellerId
        );
      });
    },
    testSellerId
  );

  describe(
    "PLAN_PURCHASE - With Affiliate",
    () => {
      it("should include affiliate data with commissionPercentage (NOT affiliateAmount)", async () => {
        // Arrange
        const req = mockRequest(
          {
            firstName: "Bob",
            lastName: "Johnson",
            email: `buyer-affiliate-${Date.now()}@example.com`,
            paymentType: "PLAN_PURCHASE",
            planType: "BUSINESS",
            planTitle: "Business Plan",
            planDescription: "Via affiliate",
            amount: 149.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
            affiliateToken: testAffiliateToken,
          },
          testSellerId
        );
        const res = mockResponse();

        global.fetch = vi.fn().mockResolvedValue(
          {
            ok: true,
            json: async () => ({
              id: "mamopay_affiliate",
              link_url: "https://mamopay.com/pay/affiliate",
              payment_url: "https://mamopay.com/checkout/affiliate",
              title: "Business Plan",
              description: "Via affiliate",
              amount: 149.99,
              amount_currency: "USD",
              active: true,
              created_date: new Date().toISOString(),
            }),
          },
          testSellerId
        );

        // Act
        await CreatePaymentLinkController.createPaymentLink(
          req as Request,
          res as Response,
          mockNext
        );

        // Assert
        const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);

        // Verify affiliate data structure
        expect(payload.custom_data.affiliateLink).toMatchObject(
          {
            id: testAffiliateLinkId,
            token: testAffiliateToken,
            itemType: "AGENCY",
            userId: testSellerId,
            commissionPercentage: 15, // From JWT
          },
          testSellerId
        );

        // Verify OLD field is NOT present
        expect(
          payload.custom_data.affiliateLink.affiliateAmount
        ).toBeUndefined();

        // Verify JWT structure
        const decoded = jwt.verify(
          testAffiliateToken,
          process.env.JWT_SECRET!
        ) as any;
        expect(decoded.commissionPercentage).toBe(15);
        expect(decoded.affiliateAmount).toBeUndefined(); // Should not exist
      });
    },
    testSellerId
  );

  describe(
    "WORKSPACE_PURCHASE - Success Cases",
    () => {
      it("should add workspaceId and workspaceName to custom_data.details", async () => {
        // Arrange
        const req = mockRequest(
          {
            firstName: "Emma",
            lastName: "Brown",
            email: `buyer-workspace-${Date.now()}@example.com`,
            paymentType: "WORKSPACE_PURCHASE",
            planType: "AGENCY",
            planTitle: "Agency Workspace",
            planDescription: "Complete workspace purchase",
            amount: 299.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
            affiliateToken: testAffiliateToken,
          },
          testSellerId
        );
        const res = mockResponse();

        global.fetch = vi.fn().mockResolvedValue(
          {
            ok: true,
            json: async () => ({
              id: "mamopay_workspace",
              link_url: "https://mamopay.com/pay/workspace",
              payment_url: "https://mamopay.com/checkout/workspace",
              title: "Agency Workspace",
              description: "Complete workspace purchase",
              amount: 299.99,
              amount_currency: "USD",
              active: true,
              created_date: new Date().toISOString(),
            }),
          },
          testSellerId
        );

        // Act
        await CreatePaymentLinkController.createPaymentLink(
          req as Request,
          res as Response,
          mockNext
        );

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);

        const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);

        // Verify workspace data in details
        expect(payload.custom_data.details).toMatchObject(
          {
            firstName: "Emma",
            lastName: "Brown",
            paymentType: "WORKSPACE_PURCHASE",
            planType: "AGENCY",
            workspaceId: testAgencyWorkspaceId,
            workspaceName: "Premium Agency Workspace",
          },
          testSellerId
        );

        // Verify workspace in affiliate data
        expect(payload.custom_data.affiliateLink).toMatchObject(
          {
            workspaceId: testAgencyWorkspaceId,
            commissionPercentage: 15,
          },
          testSellerId
        );
      });

      it("should only allow AGENCY workspaces for WORKSPACE_PURCHASE", async () => {
        // Arrange - Try to use BUSINESS workspace token
        const req = mockRequest(
          {
            firstName: "Test",
            lastName: "User",
            email: `buyer-business-reject-${Date.now()}@example.com`,
            paymentType: "WORKSPACE_PURCHASE",
            planType: "BUSINESS",
            planTitle: "Business Workspace",
            planDescription: "Should be rejected",
            amount: 199.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
            affiliateToken: businessAffiliateToken, // BUSINESS workspace!
          },
          testSellerId
        );
        const res = mockResponse();
        const next = vi.fn();

        // Act
        await CreatePaymentLinkController.createPaymentLink(
          req as Request,
          res as Response,
          next
        );

        // Assert - Should reject
        expect(next).toHaveBeenCalled();
        const error = next.mock.calls[0][0];
        expect(error.message).toMatch(/agency|workspace.*not found/i);
        expect(res.status).not.toHaveBeenCalled();
      });

      it("should validate workspace ownership", async () => {
        // Arrange - Create another seller
        const otherSeller = await prisma.user.create(
          {
            data: {
              email: `other-seller-${Date.now()}@example.com`,
              username: `otherseller${Date.now()}`,
              firstName: "Other",
              lastName: "Seller",
              password: "hashed-password",
              plan: "BUSINESS",
              verified: true,
              commissionPercentage: 10,
            },
          },
          testSellerId
        );

        // Create fake token claiming ownership of testAgencyWorkspace
        const fakeToken = jwt.sign(
          {
            userId: otherSeller.id, // Wrong owner!
            workspaceId: testAgencyWorkspaceId,
            name: "Fake Link",
            planType: "AGENCY",
            commissionPercentage: 10,
            settings: {},
            affiliateLinkId: 999999,
          },
          process.env.JWT_SECRET!
        );

        const req = mockRequest(
          {
            firstName: "Test",
            lastName: "User",
            email: `buyer-fake-owner-${Date.now()}@example.com`,
            paymentType: "WORKSPACE_PURCHASE",
            planType: "AGENCY",
            planTitle: "Fake Ownership",
            planDescription: "Should be rejected",
            amount: 299.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
            affiliateToken: fakeToken,
          },
          testSellerId
        );
        const res = mockResponse();
        const next = vi.fn();

        // Act
        await CreatePaymentLinkController.createPaymentLink(
          req as Request,
          res as Response,
          next
        );

        // Assert
        expect(next).toHaveBeenCalled();
        const error = next.mock.calls[0][0];
        expect(error.message).toMatch(
          /affiliate link.*no longer valid|seller/i
        );

        // Cleanup
        await prisma.user.delete(
          { where: { id: otherSeller.id } },
          testSellerId
        );
      });
    },
    testSellerId
  );

  describe(
    "Validation Errors",
    () => {
      it("should allow registered users to create payment links (for add-ons, etc.)", async () => {
        // Arrange - Create existing user
        const existingEmail = `existing-${Date.now()}@example.com`;
        const existingUser = await prisma.user.create({
          data: {
            email: existingEmail,
            username: `existing${Date.now()}`,
            firstName: "Existing",
            lastName: "User",
            password: "hashed-password",
            plan: "FREE",
            verified: true,
          },
        });

        const req = mockRequest(
          {
            firstName: "Existing",
            lastName: "User",
            email: existingEmail, // Already exists - should be allowed!
            paymentType: "PLAN_PURCHASE",
            planType: "BUSINESS",
            planTitle: "Test",
            planDescription: "Test",
            amount: 99.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
          },
          existingUser.id
        ); // Use the existing user's ID
        const res = mockResponse();
        const next = vi.fn();

        // Mock MamoPay API
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            id: "mamopay_test",
            link_url: "https://mamopay.com/test",
            payment_url: "https://mamopay.com/checkout/test",
            title: "Test",
            description: "Test",
            amount: 99.99,
            amount_currency: "USD",
            active: true,
            created_date: new Date().toISOString(),
          }),
        });

        // Act
        await CreatePaymentLinkController.createPaymentLink(
          req as Request,
          res as Response,
          next
        );

        // Assert - Should succeed
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();

        // Cleanup
        await prisma.user.delete({ where: { id: existingUser.id } });
      });

      it("should reject invalid JWT token", async () => {
        // Arrange
        const req = mockRequest(
          {
            firstName: "Test",
            lastName: "User",
            email: `buyer-bad-token-${Date.now()}@example.com`,
            paymentType: "PLAN_PURCHASE",
            planType: "BUSINESS",
            planTitle: "Test",
            planDescription: "Test",
            amount: 99.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
            affiliateToken: "invalid-jwt-token",
          },
          testSellerId
        );
        const res = mockResponse();
        const next = vi.fn();

        // Act
        await CreatePaymentLinkController.createPaymentLink(
          req as Request,
          res as Response,
          next
        );

        // Assert
        expect(next).toHaveBeenCalled();
        const error = next.mock.calls[0][0];
        expect(error.message).toMatch(
          /affiliate link.*invalid|expired|new link/i
        );
      });

      it("should reject if affiliate token not found in database", async () => {
        // Arrange - Create valid JWT but not in database
        const orphanToken = jwt.sign(
          {
            userId: testSellerId,
            workspaceId: testAgencyWorkspaceId,
            name: "Orphan Link",
            planType: "AGENCY",
            commissionPercentage: 15,
            settings: {},
            affiliateLinkId: 999999, // Doesn't exist
          },
          process.env.JWT_SECRET!
        );

        const req = mockRequest(
          {
            firstName: "Test",
            lastName: "User",
            email: `buyer-orphan-${Date.now()}@example.com`,
            paymentType: "PLAN_PURCHASE",
            planType: "BUSINESS",
            planTitle: "Test",
            planDescription: "Test",
            amount: 99.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
            affiliateToken: orphanToken,
          },
          testSellerId
        );
        const res = mockResponse();
        const next = vi.fn();

        // Act
        await CreatePaymentLinkController.createPaymentLink(
          req as Request,
          res as Response,
          next
        );

        // Assert
        expect(next).toHaveBeenCalled();
        const error = next.mock.calls[0][0];
        expect(error.message).toMatch(
          /affiliate link.*no longer valid|seller/i
        );
      });
    },
    testSellerId
  );

  describe("MamoPay Integration", () => {
    it("should handle MamoPay API errors gracefully", async () => {
      // Arrange
      const req = mockRequest(
        {
          firstName: "Test",
          lastName: "User",
          email: `buyer-mamopay-error-${Date.now()}@example.com`,
          paymentType: "PLAN_PURCHASE",
          planType: "BUSINESS",
          planTitle: "Test",
          planDescription: "Test",
          amount: 99.99,
          returnUrl: "https://example.com/success",
          failureReturnUrl: "https://example.com/failure",
          termsAndConditionsUrl: "https://example.com/terms",
        },
        testSellerId
      );
      const res = mockResponse();
      const next = vi.fn();

      // Mock MamoPay API failure
      global.fetch = vi.fn().mockResolvedValue(
        {
          ok: false,
          status: 500,
          text: async () => "MamoPay internal error",
        },
        testSellerId
      );

      // Act
      await CreatePaymentLinkController.createPaymentLink(
        req as Request,
        res as Response,
        next
      );

      // Assert
      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(
        /payment link creation failed|try again|support/i
      );
    });
  });
});
