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
 * 4. Validates workspace (if affiliate link contains workspaceId)
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
            // User details now come from auth token, not request body
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

        // Mock MamoPay API response (should return what we sent - centralized pricing values)
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            id: "mamopay_link_123",
            link_url: "https://mamopay.com/pay/abc123",
            payment_url: "https://mamopay.com/checkout/abc123",
            title: "Business Plan", // From centralized pricing
            description: "Full access to business features with unlimited funnels and advanced analytics", // From centralized pricing
            amount: 999, // From centralized pricing ($999/year for DIRECT BUSINESS)
            amount_currency: "USD",
            active: true,
            created_date: new Date().toISOString(),
          }),
        });

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
        expect(responseData.paymentLink).toMatchObject({
          url: "https://mamopay.com/pay/abc123",
          amount: 999, // From centralized pricing (not manual 99.99)
          frequency: "annually", // From centralized pricing (not manual monthly)
          frequencyInterval: 1,
          trialPeriodDays: 0, // From centralized pricing (not manual 14)
          planType: "BUSINESS",
        });

        // Verify MamoPay was called with correct custom_data structure
        const mamoPayCall = (global.fetch as any).mock.calls[0];
        const payload = JSON.parse(mamoPayCall[1].body);

        expect(payload.custom_data.details).toMatchObject({
          firstName: "Test", // From authenticated user
          lastName: "Seller", // From authenticated user
          // email will be seller's email from auth token
          planType: "BUSINESS",
          paymentType: "PLAN_PURCHASE",
          frequency: "annually", // From centralized pricing
          frequencyInterval: 1,
          trialDays: 0, // From centralized pricing
        });

        // Verify email comes from authenticated user
        expect(payload.custom_data.details.email).toContain("seller-");

        // Should NOT have affiliate data
        expect(payload.custom_data.affiliateLink).toBeUndefined();

        // Should NOT have removed fields
        expect(payload.custom_data.details.funnels).toBeUndefined();
        expect(payload.custom_data.details.subdomains).toBeUndefined();
        expect(payload.custom_data.details.customDomains).toBeUndefined();
        expect(payload.custom_data.details.admins).toBeUndefined();
      });

      it("should use centralized pricing values (annually, interval 1, trial 0)", async () => {
        // Arrange - DIRECT user buying AGENCY plan (manual values in request should be ignored)
        const req = mockRequest(
          {
            // User details now come from auth token
            paymentType: "PLAN_PURCHASE",
            planType: "AGENCY",
            planTitle: "Agency Plan",
            planDescription: "Premium features",
            amount: 199.99, // This will be overridden by centralized pricing ($50)
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
            // NOT providing: frequency, frequencyInterval, freeTrialPeriodInDays
          },
          testSellerId
        );
        const res = mockResponse();

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            id: "mamopay_defaults",
            link_url: "https://mamopay.com/pay/defaults",
            payment_url: "https://mamopay.com/checkout/defaults",
            title: "Partner Plan", // From centralized pricing
            description: "Enterprise-level features for agencies and partners with white-label options",
            amount: 50, // From centralized pricing
            amount_currency: "USD",
            active: true,
            created_date: new Date().toISOString(),
          }),
        });

        // Act
        await CreatePaymentLinkController.createPaymentLink(
          req as Request,
          res as Response,
          mockNext
        );

        // Assert - Centralized pricing values should be used
        const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
        expect(payload.custom_data.details).toMatchObject({
          frequency: "annually", // From centralized pricing (NOT monthly)
          frequencyInterval: 1,
          trialDays: 0,
        });

        const responseData = (res.json as any).mock.calls[0][0];
        expect(responseData.paymentLink).toMatchObject({
          frequency: "annually", // From centralized pricing
          frequencyInterval: 1,
          trialPeriodDays: 0,
        });
      });
    },
    testSellerId
  );

  describe(
    "PLAN_PURCHASE - With Affiliate",
    () => {
      it("should auto-populate affiliateToken from user registration when registrationSource is AFFILIATE", async () => {
        // Arrange - Create user with AFFILIATE registrationSource
        const affiliateUser = await prisma.user.create({
          data: {
            email: `affiliate-user-${Date.now()}@example.com`,
            username: `affiliateuser${Date.now()}`,
            firstName: "Affiliate",
            lastName: "User",
            password: "hashed-password",
            plan: "NO_PLAN",
            verified: true,
            registrationSource: "AFFILIATE",
            registrationToken: testAffiliateToken, // Stored during registration
          },
        });

        const req = mockRequest(
          {
            // User details come from auth token
            paymentType: "PLAN_PURCHASE",
            planType: "BUSINESS",
            planTitle: "Business Plan",
            planDescription: "Auto-populated affiliate",
            amount: 149.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
            // NOTE: NO affiliateToken in request body!
          },
          affiliateUser.id
        );
        const res = mockResponse();

        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            id: "mamopay_auto_affiliate",
            link_url: "https://mamopay.com/pay/auto-affiliate",
            payment_url: "https://mamopay.com/checkout/auto-affiliate",
            title: "Business Plan",
            description: "Auto-populated affiliate",
            amount: 149.99,
            amount_currency: "USD",
            active: true,
            created_date: new Date().toISOString(),
          }),
        });

        // Act
        await CreatePaymentLinkController.createPaymentLink(
          req as Request,
          res as Response,
          mockNext
        );

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);

        // Verify affiliate data was auto-populated from user.registrationToken
        expect(payload.custom_data.affiliateLink).toMatchObject({
          id: testAffiliateLinkId,
          token: testAffiliateToken,
          itemType: "AGENCY",
          userId: testSellerId,
          commissionPercentage: 15,
        });

        // Cleanup
        await prisma.user.delete({ where: { id: affiliateUser.id } });
      });

      it("should reject AGENCY plan for affiliate users (only BUSINESS allowed)", async () => {
        // Arrange - Create affiliate user trying to buy AGENCY
        const affiliateUser = await prisma.user.create({
          data: {
            email: `affiliate-agency-attempt-${Date.now()}@example.com`,
            username: `affiliateagency${Date.now()}`,
            firstName: "Affiliate",
            lastName: "AgencyAttempt",
            password: "hashed-password",
            plan: "NO_PLAN",
            verified: true,
            registrationSource: "AFFILIATE",
            registrationToken: testAffiliateToken,
          },
        });

        const req = mockRequest(
          {
            paymentType: "PLAN_PURCHASE",
            planType: "AGENCY", // ❌ Not allowed for affiliate users!
            planTitle: "Agency Plan",
            planDescription: "Should be rejected",
            amount: 299.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
          },
          affiliateUser.id
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
        expect(error.message).toMatch(/affiliate.*business.*plan/i);
        expect(res.status).not.toHaveBeenCalled();

        // Cleanup
        await prisma.user.delete({ where: { id: affiliateUser.id } });
      });

      it("should include affiliate data with commissionPercentage (NOT affiliateAmount)", async () => {
        // Arrange - Create user with AFFILIATE registrationSource
        const affiliateUser = await prisma.user.create({
          data: {
            email: `affiliate-user2-${Date.now()}@example.com`,
            username: `affiliateuser2${Date.now()}`,
            firstName: "Affiliate",
            lastName: "User2",
            password: "hashed-password",
            plan: "NO_PLAN",
            verified: true,
            registrationSource: "AFFILIATE",
            registrationToken: testAffiliateToken,
          },
        });

        const req = mockRequest(
          {
            // User details now come from auth token
            paymentType: "PLAN_PURCHASE",
            planType: "BUSINESS",
            planTitle: "Business Plan",
            planDescription: "Via affiliate",
            amount: 149.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
            // NO affiliateToken in request!
          },
          affiliateUser.id
        );
        const res = mockResponse();

        global.fetch = vi.fn().mockResolvedValue({
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
        });

        // Act
        await CreatePaymentLinkController.createPaymentLink(
          req as Request,
          res as Response,
          mockNext
        );

        // Assert
        const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);

        // Verify affiliate data structure
        expect(payload.custom_data.affiliateLink).toMatchObject({
          id: testAffiliateLinkId,
          token: testAffiliateToken,
          itemType: "AGENCY",
          userId: testSellerId,
          commissionPercentage: 15, // From JWT
        });

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

        // Cleanup
        await prisma.user.delete({ where: { id: affiliateUser.id } });
      });
    },
    testSellerId
  );

  describe(
    "PLAN_PURCHASE - Workspace Purchase (Affiliate with Workspace)",
    () => {
      it("should add workspaceId and workspaceName to custom_data.details", async () => {
        // Arrange - Create user with AFFILIATE registrationSource
        const workspaceBuyer = await prisma.user.create({
          data: {
            email: `workspace-buyer-${Date.now()}@example.com`,
            username: `workspacebuyer${Date.now()}`,
            firstName: "Workspace",
            lastName: "Buyer",
            password: "hashed-password",
            plan: "NO_PLAN",
            verified: true,
            registrationSource: "AFFILIATE",
            registrationToken: testAffiliateToken,
          },
        });

        const req = mockRequest(
          {
            // User details now come from auth token
            paymentType: "PLAN_PURCHASE",
            planType: "BUSINESS",
            planTitle: "Business Plan with Workspace",
            planDescription: "Complete workspace purchase",
            amount: 299.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
            // NO affiliateToken in request!
          },
          workspaceBuyer.id
        );
        const res = mockResponse();

        global.fetch = vi.fn().mockResolvedValue({
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
        });

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
        expect(payload.custom_data.details).toMatchObject({
          firstName: "Workspace", // From authenticated user
          lastName: "Buyer", // From authenticated user
          paymentType: "PLAN_PURCHASE",
          planType: "BUSINESS", // Workspace purchases use BUSINESS plan
          workspaceId: testAgencyWorkspaceId,
          workspaceName: "Premium Agency Workspace",
        });

        // Verify workspace in affiliate data
        expect(payload.custom_data.affiliateLink).toMatchObject({
          workspaceId: testAgencyWorkspaceId,
          commissionPercentage: 15,
        });

        // Cleanup
        await prisma.user.delete({ where: { id: workspaceBuyer.id } });
      });

      it("should only allow AGENCY workspaces for workspace purchases", async () => {
        // Arrange - Create user with BUSINESS workspace token
        const businessBuyer = await prisma.user.create({
          data: {
            email: `business-buyer-${Date.now()}@example.com`,
            username: `businessbuyer${Date.now()}`,
            firstName: "Business",
            lastName: "Buyer",
            password: "hashed-password",
            plan: "NO_PLAN",
            verified: true,
            registrationSource: "AFFILIATE",
            registrationToken: businessAffiliateToken, // BUSINESS workspace!
          },
        });

        const req = mockRequest(
          {
            // User details now come from auth token
            paymentType: "PLAN_PURCHASE",
            planType: "BUSINESS",
            planTitle: "Business Workspace",
            planDescription: "Should be rejected",
            amount: 199.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
            // NO affiliateToken - comes from registration
          },
          businessBuyer.id
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

        // Cleanup
        await prisma.user.delete({ where: { id: businessBuyer.id } });
      });

      it("should validate workspace ownership", async () => {
        // Arrange - Create another seller with workspace
        const otherSeller = await prisma.user.create({
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
        });

        // Create workspace for other seller
        const otherWorkspace = await prisma.workspace.create({
          data: {
            name: "Other Agency Workspace",
            slug: `other-agency-${Date.now()}`,
            ownerId: otherSeller.id,
            planType: "AGENCY",
            status: "ACTIVE",
          },
        });

        // Create affiliate link for other workspace
        const otherAffiliateLink = await prisma.affiliateLink.create({
          data: {
            name: "Other Workspace Link",
            token: "",
            itemType: "AGENCY",
            userId: otherSeller.id,
            workspaceId: otherWorkspace.id,
            settings: {},
          },
        });

        // Create token for other seller's workspace
        const otherToken = jwt.sign(
          {
            userId: otherSeller.id,
            workspaceId: otherWorkspace.id,
            name: "Other Workspace Link",
            planType: "AGENCY",
            commissionPercentage: 10,
            settings: {},
            affiliateLinkId: otherAffiliateLink.id,
          },
          process.env.JWT_SECRET!
        );

        await prisma.affiliateLink.update({
          where: { id: otherAffiliateLink.id },
          data: { token: otherToken },
        });

        // Create buyer who registered with this token but tries to buy testAgencyWorkspace (wrong workspace)
        const confusedBuyer = await prisma.user.create({
          data: {
            email: `confused-buyer-${Date.now()}@example.com`,
            username: `confusedbuyer${Date.now()}`,
            firstName: "Confused",
            lastName: "Buyer",
            password: "hashed-password",
            plan: "NO_PLAN",
            verified: true,
            registrationSource: "AFFILIATE",
            registrationToken: otherToken, // Registered with other seller's token
          },
        });

        const req = mockRequest(
          {
            // User details now come from auth token
            paymentType: "PLAN_PURCHASE",
            planType: "BUSINESS", // Workspace purchases use BUSINESS plan
            planTitle: "Workspace Ownership Test",
            planDescription: "Should succeed with correct workspace",
            amount: 299.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
            // Token comes from user registration
          },
          confusedBuyer.id
        );
        const res = mockResponse();
        const next = vi.fn();

        // Mock MamoPay
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({
            id: "mamopay_ownership_test",
            link_url: "https://mamopay.com/pay/ownership",
            payment_url: "https://mamopay.com/checkout/ownership",
            title: "Workspace Ownership Test",
            description: "Should succeed with correct workspace",
            amount: 299.99,
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

        // Assert - Should SUCCEED with correct workspace from registration token
        expect(res.status).toHaveBeenCalledWith(200);
        expect(next).not.toHaveBeenCalled();

        const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
        expect(payload.custom_data.details.workspaceId).toBe(otherWorkspace.id);
        expect(payload.custom_data.affiliateLink.userId).toBe(otherSeller.id);

        // Cleanup
        await prisma.user.delete({ where: { id: confusedBuyer.id } });
        await prisma.affiliateLink.delete({ where: { id: otherAffiliateLink.id } });
        await prisma.workspace.delete({ where: { id: otherWorkspace.id } });
        await prisma.user.delete({ where: { id: otherSeller.id } });
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
            // User details now come from auth token (existingUser)
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

      it("should reject if user has invalid affiliate token in registration", async () => {
        // Arrange - Create user with invalid token in registration
        const invalidTokenUser = await prisma.user.create({
          data: {
            email: `invalid-token-${Date.now()}@example.com`,
            username: `invalidtoken${Date.now()}`,
            firstName: "Invalid",
            lastName: "Token",
            password: "hashed-password",
            plan: "NO_PLAN",
            verified: true,
            registrationSource: "AFFILIATE",
            registrationToken: "invalid-jwt-token", // Invalid token
          },
        });

        const req = mockRequest(
          {
            // User details now come from auth token
            paymentType: "PLAN_PURCHASE",
            planType: "BUSINESS",
            planTitle: "Test",
            planDescription: "Test",
            amount: 99.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
          },
          invalidTokenUser.id
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

        // Cleanup
        await prisma.user.delete({ where: { id: invalidTokenUser.id } });
      });

      it("should reject if affiliate token in registration not found in database", async () => {
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

        const orphanUser = await prisma.user.create({
          data: {
            email: `orphan-user-${Date.now()}@example.com`,
            username: `orphanuser${Date.now()}`,
            firstName: "Orphan",
            lastName: "User",
            password: "hashed-password",
            plan: "NO_PLAN",
            verified: true,
            registrationSource: "AFFILIATE",
            registrationToken: orphanToken, // Valid JWT but not in DB
          },
        });

        const req = mockRequest(
          {
            // User details now come from auth token
            paymentType: "PLAN_PURCHASE",
            planType: "BUSINESS",
            planTitle: "Test",
            planDescription: "Test",
            amount: 99.99,
            returnUrl: "https://example.com/success",
            failureReturnUrl: "https://example.com/failure",
            termsAndConditionsUrl: "https://example.com/terms",
          },
          orphanUser.id
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
        await prisma.user.delete({ where: { id: orphanUser.id } });
      });
    },
    testSellerId
  );

  describe("MamoPay Integration", () => {
    it("should handle MamoPay API errors gracefully", async () => {
      // Arrange
      const req = mockRequest(
        {
          // User details now come from auth token
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
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "MamoPay internal error",
      });

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
