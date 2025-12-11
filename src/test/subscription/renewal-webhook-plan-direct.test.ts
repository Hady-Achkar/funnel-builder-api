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
import { PrismaClient, UserPlan } from "../../generated/prisma-client";
import { RenewalWebhookController } from "../../controllers/subscription/renewal-webhook";
import sgMail from "@sendgrid/mail";
import axios from "axios";
import { Request, Response, NextFunction } from "express";

// Mock email services
vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
  },
}));

// Mock axios for MamoPay
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));

describe("Renewal Webhook - Plan Direct User", () => {
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  beforeAll(async () => {
    // Setup test environment
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(`\n🔧 Running renewal tests against database: ${dbName}\n`);

    process.env.JWT_SECRET = "test-secret";
    process.env.FRONTEND_URL = "https://test.example.com";
    process.env.SENDGRID_API_KEY = "test-key";
    process.env.SENDGRID_FROM_EMAIL = "test@example.com";
    process.env.MAMOPAY_API_URL = "https://test.mamopay.com";
    process.env.MAMOPAY_API_KEY = "test-api-key";
  });

  afterAll(async () => {
    // Final cleanup in reverse order of dependencies
    try {
      await prisma.subscription.deleteMany({});
      await prisma.payment.deleteMany({});
      await prisma.affiliateLink.deleteMany({});
      await prisma.workspace.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.warn("Cleanup error in afterAll:", error);
    }
    await prismaClient.$disconnect();
  });

  beforeEach(async () => {
    // Clear data in correct order
    try {
      await prisma.subscription.deleteMany({});
      await prisma.payment.deleteMany({});
      await prisma.affiliateLink.deleteMany({});
      await prisma.workspace.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.warn("Cleanup error in beforeEach:", error);
    }
    vi.clearAllMocks();

    // Mock MamoPay API - Default success response
    vi.mocked(axios.get).mockResolvedValue({
      data: [
        {
          id: "MPB-SUBSCRIBER-RENEWAL-TEST",
          status: "Active",
          customer: {
            id: "CUS-RENEWAL-TEST",
            name: "Test Renewal User",
            email: "renewal@test.com",
          },
        },
      ],
    });
  });

  describe("Direct User Plan Renewal", () => {
    it("should renew BUSINESS plan monthly subscription and use next_payment_date", async () => {
      // Arrange - Create existing user with BUSINESS plan
      const existingUser = await prisma.user.create({
        data: {
          email: "business-renewal@test.com",
          username: "businessrenewal",
          firstName: "Business",
          lastName: "Renewal",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-01-01"),
        },
      });

      // Create existing subscription ending today
      const currentEndDate = new Date("2025-01-20"); // Fixed date for consistent testing
      const existingSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-BUSINESS-001",
          userId: existingUser.id,
          startsAt: new Date("2024-01-20"),
          endsAt: currentEndDate,
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "PLAN",
          subscriptionType: UserPlan.BUSINESS,
        },
      });

      // Create renewal webhook payload (subscription.succeeded event)
      const renewalWebhook = {
        event_type: "subscription.succeeded", // Different from charge.succeeded
        status: "captured",
        id: "PAY-RENEWAL-BUSINESS-001",
        amount: 30.60, // $30 + 2% fee
        amount_currency: "USD",
        subscription_id: "MPB-SUB-BUSINESS-001",
        next_payment_date: "20/02/2025", // DD/MM/YYYY format from MamoPay
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "business-renewal@test.com",
            firstName: "Business",
            lastName: "Renewal",
            planType: "BUSINESS",
            frequency: "monthly",
            paymentType: "PLAN_PURCHASE",
            trialDays: 0,
            trialEndDate: new Date("2025-01-01").toISOString(),
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Business Renewal",
          email: "business-renewal@test.com",
          phone_number: "+1234567890",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST",
          type: "CREDIT VISA",
          card_holder_name: "Business Renewal",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
        settlement_amount: "112.20",
        settlement_currency: "AED",
        settlement_date: "2025-10-27",
        settlement_fee: "AED 1.32",
        settlement_vat: "AED 0.07",
        payment_link_id: "MB-LINK-TEST",
        payment_link_url: "https://test.mamopay.com/pay/test",
        external_id: null,
        billing_descriptor: "Mamo*DIGITALSITE FZCO Dubai",
        error_code: null,
        error_message: null,
      };

      // Act - Call controller with mock request/response
      const mockReq = {
        body: renewalWebhook,
      } as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Assert - Response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
          message: "Subscription renewed successfully",
          data: expect.objectContaining({
            userId: existingUser.id,
            paymentId: expect.any(Number),
            subscriptionId: existingSubscription.id,
          }),
        })
      );

      // Assert - Payment record created
      const payment = await prisma.payment.findFirst({
        where: { transactionId: "PAY-RENEWAL-BUSINESS-001" },
      });
      expect(payment).toBeDefined();
      expect(payment?.amount).toBe(30.60);
      expect(payment?.paymentType).toBe("PLAN_PURCHASE"); // Same type for renewals
      expect(payment?.itemType).toBe(UserPlan.BUSINESS);
      expect(payment?.buyerId).toBe(existingUser.id);

      // Assert - Subscription extended using next_payment_date
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: existingSubscription.id },
      });
      expect(updatedSubscription?.status).toBe("ACTIVE");

      // IMPORTANT: Should use next_payment_date (20/02/2025) as the new endsAt
      // Parse DD/MM/YYYY format correctly
      const expectedNewEndDate = new Date("2025-02-20"); // From next_payment_date: 20/02/2025
      expect(updatedSubscription?.endsAt.toISOString().split('T')[0]).toBe(
        expectedNewEndDate.toISOString().split('T')[0]
      );

      // Assert - User plan NOT changed BUT trialEndDate IS updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: existingUser.id },
      });
      expect(updatedUser?.plan).toBe(UserPlan.BUSINESS); // Same as before

      // trialEndDate should now match the renewal date (2025-02-20)
      const expectedTrialEnd = new Date("2025-02-20");
      expect(updatedUser?.trialEndDate?.toISOString().split('T')[0]).toBe(
        expectedTrialEnd.toISOString().split('T')[0]
      );

      // Assert - Renewal confirmation email sent (not set password email)
      expect(sgMail.send).toHaveBeenCalledTimes(1);
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "business-renewal@test.com",
          subject: expect.stringContaining("Subscription Renewed"),
        })
      );
    });

    it("should renew AGENCY plan annual subscription and handle yearly next_payment_date", async () => {
      // Arrange - Create existing user with AGENCY plan
      const existingUser = await prisma.user.create({
        data: {
          email: "agency-annual@test.com",
          username: "agencyannual",
          firstName: "Agency",
          lastName: "Annual",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.AGENCY,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-01-01"),
        },
      });

      const currentEndDate = new Date("2025-01-20");
      const existingSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-AGENCY-ANNUAL-001",
          userId: existingUser.id,
          startsAt: new Date("2024-01-20"),
          endsAt: currentEndDate,
          status: "ACTIVE",
          intervalUnit: "YEAR",
          intervalCount: 1,
          itemType: "PLAN",
          subscriptionType: UserPlan.AGENCY,
        },
      });

      const renewalWebhook = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-RENEWAL-AGENCY-ANNUAL",
        amount: 102.00,
        amount_currency: "USD",
        subscription_id: "MPB-SUB-AGENCY-ANNUAL-001",
        next_payment_date: "20/01/2026", // One year later
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "agency-annual@test.com",
            firstName: "Agency",
            lastName: "Annual",
            planType: "AGENCY",
            frequency: "annually",
            paymentType: "PLAN_PURCHASE",
            trialDays: 0,
            trialEndDate: new Date("2025-01-01").toISOString(),
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Agency Annual",
          email: "agency-annual@test.com",
          phone_number: "+1234567890",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST-ANNUAL",
          type: "CREDIT VISA",
          card_holder_name: "Agency Annual",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2026",
          origin: "International card",
        },
        settlement_amount: "374.34",
        settlement_currency: "AED",
        settlement_date: "2026-01-20",
        settlement_fee: "AED 4.53",
        settlement_vat: "AED 0.23",
        payment_link_id: "MB-LINK-TEST",
        payment_link_url: "https://test.mamopay.com/pay/test",
        external_id: null,
        billing_descriptor: "Mamo*DIGITALSITE FZCO Dubai",
        error_code: null,
        error_message: null,
      };

      // Act - Call controller
      const mockReq = {
        body: renewalWebhook,
      } as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Assert - Subscription renewed
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: existingSubscription.id },
      });

      // Should be exactly next_payment_date: 20/01/2026
      const expectedDate = new Date("2026-01-20");
      expect(updatedSubscription?.endsAt.toISOString().split('T')[0]).toBe(
        expectedDate.toISOString().split('T')[0]
      );
      expect(updatedSubscription?.status).toBe("ACTIVE");

      // Assert - Payment created
      const payment = await prisma.payment.findFirst({
        where: { transactionId: "PAY-RENEWAL-AGENCY-ANNUAL" },
      });
      expect(payment).toBeDefined();
      expect(payment?.amount).toBe(102.00);
      expect(payment?.itemType).toBe(UserPlan.AGENCY);
    });

    it("should extend user trialEndDate when renewing PLAN_PURCHASE", async () => {
      // Arrange - Create user with trialEndDate set to expire soon
      const oldTrialEndDate = new Date("2025-01-20");
      const existingUser = await prisma.user.create({
        data: {
          email: "trial-extend@test.com",
          username: "trialextend",
          firstName: "Trial",
          lastName: "Extend",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: oldTrialEndDate, // Will be extended
        },
      });

      const existingSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-TRIAL-EXTEND",
          userId: existingUser.id,
          startsAt: new Date("2024-01-20"),
          endsAt: oldTrialEndDate,
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "PLAN",
          subscriptionType: UserPlan.BUSINESS,
        },
      });

      const renewalWebhook = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-TRIAL-EXTEND",
        amount: 30.60,
        amount_currency: "USD",
        subscription_id: "MPB-SUB-TRIAL-EXTEND",
        next_payment_date: "20/02/2025",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "trial-extend@test.com",
            firstName: "Trial",
            lastName: "Extend",
            planType: "BUSINESS",
            frequency: "monthly",
            paymentType: "PLAN_PURCHASE", // Important: PLAN_PURCHASE triggers trialEndDate update
            trialDays: 0,
            trialEndDate: new Date("2025-01-01").toISOString(),
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Trial Extend",
          email: "trial-extend@test.com",
          phone_number: "+1234567890",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST",
          type: "CREDIT VISA",
          card_holder_name: "Trial Extend",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
        settlement_amount: "112.20",
        settlement_currency: "AED",
        settlement_date: "2025-02-20",
        settlement_fee: "AED 1.32",
        settlement_vat: "AED 0.07",
        payment_link_id: "MB-LINK-TEST",
        payment_link_url: "https://test.mamopay.com/pay/test",
        external_id: null,
        billing_descriptor: "Mamo*DIGITALSITE FZCO Dubai",
        error_code: null,
        error_message: null,
      };

      // Act
      const mockReq = {
        body: renewalWebhook,
      } as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Assert - User trialEndDate extended to match next_payment_date
      const updatedUser = await prisma.user.findUnique({
        where: { id: existingUser.id },
      });

      const expectedNewEndDate = new Date("2025-02-20");
      expect(updatedUser?.trialEndDate?.toISOString().split('T')[0]).toBe(
        expectedNewEndDate.toISOString().split('T')[0]
      );

      // Old date was 2025-01-20, new is 2025-02-20
      expect(updatedUser?.trialEndDate?.toISOString().split('T')[0]).not.toBe(
        oldTrialEndDate.toISOString().split('T')[0]
      );
    });

    it("should set subscription status to ACTIVE even if it was EXPIRED/CANCELLED", async () => {
      // Arrange - Create subscription with EXPIRED status
      const existingUser = await prisma.user.create({
        data: {
          email: "reactivate@test.com",
          username: "reactivate",
          firstName: "Reactivate",
          lastName: "Test",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-01-20"),
        },
      });

      const existingSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-REACTIVATE",
          userId: existingUser.id,
          startsAt: new Date("2024-01-20"),
          endsAt: new Date("2025-01-20"),
          status: "EXPIRED", // Subscription was expired
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "PLAN",
          subscriptionType: UserPlan.BUSINESS,
        },
      });

      const renewalWebhook = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-REACTIVATE",
        amount: 30.60,
        amount_currency: "USD",
        subscription_id: "MPB-SUB-REACTIVATE",
        next_payment_date: "20/02/2025",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "reactivate@test.com",
            firstName: "Reactivate",
            lastName: "Test",
            planType: "BUSINESS",
            frequency: "monthly",
            paymentType: "PLAN_PURCHASE",
            trialDays: 0,
            trialEndDate: new Date("2025-01-01").toISOString(),
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Reactivate Test",
          email: "reactivate@test.com",
          phone_number: "+1234567890",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST",
          type: "CREDIT VISA",
          card_holder_name: "Reactivate Test",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
        settlement_amount: "112.20",
        settlement_currency: "AED",
        settlement_date: "2025-02-20",
        settlement_fee: "AED 1.32",
        settlement_vat: "AED 0.07",
        payment_link_id: "MB-LINK-TEST",
        payment_link_url: "https://test.mamopay.com/pay/test",
        external_id: null,
        billing_descriptor: "Mamo*DIGITALSITE FZCO Dubai",
        error_code: null,
        error_message: null,
      };

      // Act
      const mockReq = {
        body: renewalWebhook,
      } as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Assert - Subscription status changed from EXPIRED to ACTIVE
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: existingSubscription.id },
      });

      expect(updatedSubscription?.status).toBe("ACTIVE");

      // Verify it was EXPIRED before
      expect(existingSubscription.status).toBe("EXPIRED");
    });

    it("should accumulate rawData as array with each renewal webhook", async () => {
      // Arrange - Create subscription with initial rawData (single object)
      const existingUser = await prisma.user.create({
        data: {
          email: "rawdata-test@test.com",
          username: "rawdatatest",
          firstName: "RawData",
          lastName: "Test",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-01-20"),
        },
      });

      const initialRawData = {
        event_type: "charge.succeeded",
        id: "PAY-INITIAL-PURCHASE",
        amount: 30.60,
        subscription_id: "MPB-SUB-RAWDATA-TEST",
      };

      const existingSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-RAWDATA-TEST",
          userId: existingUser.id,
          startsAt: new Date("2024-01-20"),
          endsAt: new Date("2025-01-20"),
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "PLAN",
          subscriptionType: UserPlan.BUSINESS,
          rawData: [initialRawData], // Initial purchase webhook (now as array)
        },
      });

      const renewalWebhook = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-RENEWAL-RAWDATA-1",
        amount: 30.60,
        amount_currency: "USD",
        subscription_id: "MPB-SUB-RAWDATA-TEST",
        next_payment_date: "20/02/2025",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "rawdata-test@test.com",
            firstName: "RawData",
            lastName: "Test",
            planType: "BUSINESS",
            frequency: "monthly",
            paymentType: "PLAN_PURCHASE",
            trialDays: 0,
            trialEndDate: new Date("2025-01-01").toISOString(),
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "RawData Test",
          email: "rawdata-test@test.com",
          phone_number: "+1234567890",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST",
          type: "CREDIT VISA",
          card_holder_name: "RawData Test",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
        settlement_amount: "112.20",
        settlement_currency: "AED",
        settlement_date: "2025-02-20",
        settlement_fee: "AED 1.32",
        settlement_vat: "AED 0.07",
        payment_link_id: "MB-LINK-TEST",
        payment_link_url: "https://test.mamopay.com/pay/test",
        external_id: null,
        billing_descriptor: "Mamo*DIGITALSITE FZCO Dubai",
        error_code: null,
        error_message: null,
      };

      // Act - First renewal
      const mockReq = {
        body: renewalWebhook,
      } as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Assert - rawData should now be an array with 2 entries
      const afterFirstRenewal = await prisma.subscription.findUnique({
        where: { id: existingSubscription.id },
      });

      const rawDataAfterFirst = afterFirstRenewal?.rawData as any;
      expect(Array.isArray(rawDataAfterFirst)).toBe(true);
      expect(rawDataAfterFirst).toHaveLength(2); // Initial + 1st renewal

      // First entry should be the initial purchase - verify ALL data preserved
      expect(rawDataAfterFirst[0].event_type).toBe("charge.succeeded");
      expect(rawDataAfterFirst[0].id).toBe("PAY-INITIAL-PURCHASE");
      expect(rawDataAfterFirst[0].amount).toBe(30.60);
      expect(rawDataAfterFirst[0].subscription_id).toBe("MPB-SUB-RAWDATA-TEST");

      // Second entry should be the first renewal - verify ALL webhook data preserved
      expect(rawDataAfterFirst[1].event_type).toBe("subscription.succeeded");
      expect(rawDataAfterFirst[1].id).toBe("PAY-RENEWAL-RAWDATA-1");
      expect(rawDataAfterFirst[1].status).toBe("captured");
      expect(rawDataAfterFirst[1].amount).toBe(30.60);
      expect(rawDataAfterFirst[1].amount_currency).toBe("USD");
      expect(rawDataAfterFirst[1].subscription_id).toBe("MPB-SUB-RAWDATA-TEST");
      expect(rawDataAfterFirst[1].next_payment_date).toBe("20/02/2025");
      expect(rawDataAfterFirst[1].custom_data).toBeDefined();
      expect(rawDataAfterFirst[1].custom_data.details.email).toBe("rawdata-test@test.com");
      expect(rawDataAfterFirst[1].customer_details).toBeDefined();
      expect(rawDataAfterFirst[1].customer_details.name).toBe("RawData Test");
      expect(rawDataAfterFirst[1].payment_method).toBeDefined();
      expect(rawDataAfterFirst[1].payment_method.card_last4).toBe("4242");

      // Act - Second renewal (simulate next month)
      const secondRenewalWebhook = {
        ...renewalWebhook,
        id: "PAY-RENEWAL-RAWDATA-2",
        next_payment_date: "20/03/2025",
        created_date: new Date().toISOString(),
      };

      const mockReq2 = {
        body: secondRenewalWebhook,
      } as Request;

      const mockRes2 = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext2 = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq2, mockRes2, mockNext2);

      // Assert - rawData should now have 3 entries
      const afterSecondRenewal = await prisma.subscription.findUnique({
        where: { id: existingSubscription.id },
      });

      const rawDataAfterSecond = afterSecondRenewal?.rawData as any;
      expect(Array.isArray(rawDataAfterSecond)).toBe(true);
      expect(rawDataAfterSecond).toHaveLength(3); // Initial + 2 renewals

      // Third entry should be the second renewal - verify ALL data preserved
      expect(rawDataAfterSecond[2].event_type).toBe("subscription.succeeded");
      expect(rawDataAfterSecond[2].id).toBe("PAY-RENEWAL-RAWDATA-2");
      expect(rawDataAfterSecond[2].next_payment_date).toBe("20/03/2025");
      expect(rawDataAfterSecond[2].status).toBe("captured");
      expect(rawDataAfterSecond[2].amount).toBe(30.60);
      expect(rawDataAfterSecond[2].custom_data.details.planType).toBe("BUSINESS");

      // Verify first two entries are still intact
      expect(rawDataAfterSecond[0].id).toBe("PAY-INITIAL-PURCHASE");
      expect(rawDataAfterSecond[1].id).toBe("PAY-RENEWAL-RAWDATA-1");
      expect(rawDataAfterSecond[1].next_payment_date).toBe("20/02/2025");
    });
  });

  describe("Affiliate User Renewal - NO Commission", () => {
    it("should renew subscription for affiliate user WITHOUT creating new commission", async () => {
      // CRITICAL TEST: Affiliate users should NOT get commission on renewals

      // Create affiliate owner
      const affiliateOwner = await prisma.user.create({
        data: {
          email: "affiliate-owner@test.com",
          username: "affiliateowner",
          firstName: "Affiliate",
          lastName: "Owner",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.AGENCY,
          balance: 0,
          pendingBalance: 50.00, // Had commission from initial purchase
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-01-01"),
        },
      });

      // Create workspace for affiliate owner
      const workspace = await prisma.workspace.create({
        data: {
          name: "Affiliate Workspace",
          slug: "affiliate-workspace-test",
          ownerId: affiliateOwner.id,
        },
      });

      // Create affiliate link
      const affiliateLink = await prisma.affiliateLink.create({
        data: {
          name: "Test Affiliate Link",
          token: "affiliate-token-123",
          itemType: UserPlan.BUSINESS,
          userId: affiliateOwner.id,
          workspaceId: workspace.id,
          clickCount: 5,
          totalAmount: 50.00,
        },
      });

      // Create user who came through affiliate
      const affiliateUser = await prisma.user.create({
        data: {
          email: "affiliate-buyer@test.com",
          username: "affiliatebuyer",
          firstName: "Affiliate",
          lastName: "Buyer",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          referralLinkUsedId: affiliateLink.id, // Linked to affiliate
          registrationSource: "AFFILIATE",
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-01-01"),
        },
      });

      const currentEndDate = new Date("2025-01-20");
      const existingSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-AFFILIATE-USER",
          userId: affiliateUser.id,
          startsAt: new Date("2024-01-20"),
          endsAt: currentEndDate,
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "PLAN",
          subscriptionType: UserPlan.BUSINESS,
        },
      });

      const renewalWebhook = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-RENEWAL-AFFILIATE-USER",
        amount: 30.60,
        amount_currency: "USD",
        subscription_id: "MPB-SUB-AFFILIATE-USER",
        next_payment_date: "20/02/2025",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "affiliate-buyer@test.com",
            firstName: "Affiliate",
            lastName: "Buyer",
            planType: "BUSINESS",
            frequency: "monthly",
            paymentType: "PLAN_PURCHASE",
            trialDays: 0,
            trialEndDate: new Date("2025-01-01").toISOString(),
            frequencyInterval: 1,
          },
          // NOTE: NO affiliateLink in renewal webhooks - this is critical!
        },
        customer_details: {
          name: "Affiliate Buyer",
          email: "affiliate-buyer@test.com",
          phone_number: "+1234567890",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST-AFFILIATE",
          type: "CREDIT VISA",
          card_holder_name: "Affiliate Buyer",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
        settlement_amount: "112.20",
        settlement_currency: "AED",
        settlement_date: "2025-02-20",
        settlement_fee: "AED 1.32",
        settlement_vat: "AED 0.07",
        payment_link_id: "MB-LINK-TEST",
        payment_link_url: "https://test.mamopay.com/pay/test",
        external_id: null,
        billing_descriptor: "Mamo*DIGITALSITE FZCO Dubai",
        error_code: null,
        error_message: null,
      };

      // Act
      const mockReq = {
        body: renewalWebhook,
      } as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Assert - Response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
          message: "Subscription renewed successfully",
        })
      );

      // CRITICAL: Check NO new commission created
      const updatedAffiliateOwner = await prisma.user.findUnique({
        where: { id: affiliateOwner.id },
      });
      expect(updatedAffiliateOwner?.pendingBalance).toBe(50.00); // Unchanged!

      // Check NO new balance transaction
      const transactions = await prisma.balanceTransaction.findMany({
        where: { userId: affiliateOwner.id },
      });
      expect(transactions).toHaveLength(0); // No transactions on renewal

      // Verify payment has NO affiliate link
      const payment = await prisma.payment.findFirst({
        where: { transactionId: "PAY-RENEWAL-AFFILIATE-USER" },
      });
      expect(payment?.affiliateLinkId).toBeNull(); // No affiliate linkage
      expect(payment?.commissionAmount).toBeNull();
      expect(payment?.commissionStatus).toBeNull();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should ignore wrong event type (charge.succeeded)", async () => {
      const webhook = {
        event_type: "charge.succeeded", // Wrong event type
        status: "captured",
        id: "PAY-WRONG-TYPE",
        subscription_id: "SUB-TEST",
      };

      const mockReq = {
        body: webhook,
      } as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
          ignored: true,
          reason: "Only subscription.succeeded events are processed",
        })
      );
    });

    it("should ignore duplicate renewal payment (idempotency)", async () => {
      // Create user and subscription
      const user = await prisma.user.create({
        data: {
          email: "duplicate-test@test.com",
          username: "duplicatetest",
          firstName: "Duplicate",
          lastName: "Test",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-01-01"),
        },
      });

      const subscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-DUP-TEST",
          userId: user.id,
          startsAt: new Date("2024-01-20"),
          endsAt: new Date("2025-01-20"),
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "PLAN",
          subscriptionType: UserPlan.BUSINESS,
        },
      });

      // Create initial payment to simulate already processed webhook
      await prisma.payment.create({
        data: {
          transactionId: "PAY-DUPLICATE-TEST",
          amount: 30.60,
          currency: "USD",
          status: "captured",
          itemType: UserPlan.BUSINESS,
          paymentType: "PLAN_PURCHASE",
          buyerId: user.id,
        },
      });

      // Send same webhook again
      const webhook = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-DUPLICATE-TEST", // Same transaction ID
        subscription_id: "MPB-SUB-DUP-TEST",
        amount: 30.60,
        amount_currency: "USD",
        next_payment_date: "20/02/2025",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "duplicate-test@test.com",
            firstName: "Duplicate",
            lastName: "Test",
            planType: "BUSINESS",
            frequency: "monthly",
            paymentType: "PLAN_PURCHASE",
            trialDays: 0,
            trialEndDate: new Date("2025-01-01").toISOString(),
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Duplicate Test",
          email: "duplicate-test@test.com",
          phone_number: "+1234567890",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST",
          type: "CREDIT VISA",
          card_holder_name: "Duplicate Test",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
        settlement_amount: "112.20",
        settlement_currency: "AED",
        settlement_date: "2025-02-20",
        settlement_fee: "AED 1.32",
        settlement_vat: "AED 0.07",
        payment_link_id: "MB-LINK-TEST",
        payment_link_url: "https://test.mamopay.com/pay/test",
        external_id: null,
        billing_descriptor: "Mamo*DIGITALSITE FZCO Dubai",
        error_code: null,
        error_message: null,
      };

      const mockReq = {
        body: webhook,
      } as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
          ignored: true,
          reason: "Payment already processed",
        })
      );
    });

    it("should reject renewal for non-existent subscription", async () => {
      const webhook = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-NO-SUB",
        subscription_id: "SUB-NON-EXISTENT-999",
        amount: 30.60,
        amount_currency: "USD",
        next_payment_date: "20/02/2025",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "nosub@test.com",
            firstName: "No Sub",
            lastName: "Test",
            planType: "BUSINESS",
            frequency: "monthly",
            paymentType: "PLAN_PURCHASE",
            trialDays: 0,
            trialEndDate: new Date("2025-01-01").toISOString(),
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "No Sub Test",
          email: "nosub@test.com",
          phone_number: "+1234567890",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST",
          type: "CREDIT VISA",
          card_holder_name: "No Sub Test",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
        settlement_amount: "112.20",
        settlement_currency: "AED",
        settlement_date: "2025-02-20",
        settlement_fee: "AED 1.32",
        settlement_vat: "AED 0.07",
        payment_link_id: "MB-LINK-TEST",
        payment_link_url: "https://test.mamopay.com/pay/test",
        external_id: null,
        billing_descriptor: "Mamo*DIGITALSITE FZCO Dubai",
        error_code: null,
        error_message: null,
      };

      const mockReq = {
        body: webhook,
      } as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Should call next with error
      expect(mockNext).toHaveBeenCalled();
      const nextMock = mockNext as ReturnType<typeof vi.fn>;
      const error = nextMock.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain("Subscription not found");
    });

    it("should handle invalid next_payment_date format gracefully", async () => {
      // Create user and subscription
      const user = await prisma.user.create({
        data: {
          email: "invalid-date@test.com",
          username: "invaliddate",
          firstName: "Invalid",
          lastName: "Date",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-01-01"),
        },
      });

      await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-INVALID-DATE",
          userId: user.id,
          startsAt: new Date("2024-01-20"),
          endsAt: new Date("2025-01-20"),
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "PLAN",
          subscriptionType: UserPlan.BUSINESS,
        },
      });

      const webhook = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-INVALID-DATE",
        subscription_id: "MPB-SUB-INVALID-DATE",
        amount: 30.60,
        amount_currency: "USD",
        next_payment_date: "invalid-date-format", // Invalid format
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "invalid-date@test.com",
            firstName: "Invalid",
            lastName: "Date",
            planType: "BUSINESS",
            frequency: "monthly",
            paymentType: "PLAN_PURCHASE",
            trialDays: 0,
            trialEndDate: new Date("2025-01-01").toISOString(),
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Invalid Date",
          email: "invalid-date@test.com",
          phone_number: "+1234567890",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST",
          type: "CREDIT VISA",
          card_holder_name: "Invalid Date",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
        settlement_amount: "112.20",
        settlement_currency: "AED",
        settlement_date: "2025-02-20",
        settlement_fee: "AED 1.32",
        settlement_vat: "AED 0.07",
        payment_link_id: "MB-LINK-TEST",
        payment_link_url: "https://test.mamopay.com/pay/test",
        external_id: null,
        billing_descriptor: "Mamo*DIGITALSITE FZCO Dubai",
        error_code: null,
        error_message: null,
      };

      const mockReq = {
        body: webhook,
      } as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Should call next with error about invalid date format
      expect(mockNext).toHaveBeenCalled();
      const nextMock = mockNext as ReturnType<typeof vi.fn>;
      const error = nextMock.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain("Invalid next_payment_date format");
    });

    it("should handle missing next_payment_date", async () => {
      // Create user and subscription
      const user = await prisma.user.create({
        data: {
          email: "missing-date@test.com",
          username: "missingdate",
          firstName: "Missing",
          lastName: "Date",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-01-01"),
        },
      });

      await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-MISSING-DATE",
          userId: user.id,
          startsAt: new Date("2024-01-20"),
          endsAt: new Date("2025-01-20"),
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "PLAN",
          subscriptionType: UserPlan.BUSINESS,
        },
      });

      const webhook = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-MISSING-DATE",
        subscription_id: "MPB-SUB-MISSING-DATE",
        amount: 30.60,
        amount_currency: "USD",
        // next_payment_date is missing
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "missing-date@test.com",
            firstName: "Missing",
            lastName: "Date",
            planType: "BUSINESS",
            frequency: "monthly",
            paymentType: "PLAN_PURCHASE",
            trialDays: 0,
            trialEndDate: new Date("2025-01-01").toISOString(),
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Missing Date",
          email: "missing-date@test.com",
          phone_number: "+1234567890",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST",
          type: "CREDIT VISA",
          card_holder_name: "Missing Date",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
        settlement_amount: "112.20",
        settlement_currency: "AED",
        settlement_date: "2025-02-20",
        settlement_fee: "AED 1.32",
        settlement_vat: "AED 0.07",
        payment_link_id: "MB-LINK-TEST",
        payment_link_url: "https://test.mamopay.com/pay/test",
        external_id: null,
        billing_descriptor: "Mamo*DIGITALSITE FZCO Dubai",
        error_code: null,
        error_message: null,
      };

      const mockReq = {
        body: webhook,
      } as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Should call next with error about missing date
      expect(mockNext).toHaveBeenCalled();
      const nextMock = mockNext as ReturnType<typeof vi.fn>;
      const error = nextMock.mock.calls[0][0];
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain("next_payment_date is required");
    });

    it("should continue processing even if email service fails", async () => {
      // Create user and subscription
      const user = await prisma.user.create({
        data: {
          email: "email-fail@test.com",
          username: "emailfail",
          firstName: "Email",
          lastName: "Fail",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-01-01"),
        },
      });

      const subscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-EMAIL-FAIL",
          userId: user.id,
          startsAt: new Date("2024-01-20"),
          endsAt: new Date("2025-01-20"),
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "PLAN",
          subscriptionType: UserPlan.BUSINESS,
        },
      });

      // Mock email failure
      vi.mocked(sgMail.send).mockRejectedValueOnce(new Error("SendGrid error"));

      const webhook = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-EMAIL-FAIL",
        subscription_id: "MPB-SUB-EMAIL-FAIL",
        amount: 30.60,
        amount_currency: "USD",
        next_payment_date: "20/02/2025",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "email-fail@test.com",
            firstName: "Email",
            lastName: "Fail",
            planType: "BUSINESS",
            frequency: "monthly",
            paymentType: "PLAN_PURCHASE",
            trialDays: 0,
            trialEndDate: new Date("2025-01-01").toISOString(),
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Email Fail",
          email: "email-fail@test.com",
          phone_number: "+1234567890",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST",
          type: "CREDIT VISA",
          card_holder_name: "Email Fail",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
        settlement_amount: "112.20",
        settlement_currency: "AED",
        settlement_date: "2025-02-20",
        settlement_fee: "AED 1.32",
        settlement_vat: "AED 0.07",
        payment_link_id: "MB-LINK-TEST",
        payment_link_url: "https://test.mamopay.com/pay/test",
        external_id: null,
        billing_descriptor: "Mamo*DIGITALSITE FZCO Dubai",
        error_code: null,
        error_message: null,
      };

      const mockReq = {
        body: webhook,
      } as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Should still succeed despite email failure
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
          message: "Subscription renewed successfully",
        })
      );

      // Verify payment and subscription were still updated
      const payment = await prisma.payment.findFirst({
        where: { transactionId: "PAY-EMAIL-FAIL" },
      });
      expect(payment).toBeDefined();

      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: subscription.id },
      });
      expect(updatedSubscription?.endsAt.toISOString().split('T')[0]).toBe("2025-02-20");
    });

    it("should ignore non-captured status", async () => {
      const webhook = {
        event_type: "subscription.succeeded",
        status: "pending", // Not captured
        id: "PAY-PENDING",
        subscription_id: "SUB-TEST",
        amount: 30.60,
        amount_currency: "USD",
      };

      const mockReq = {
        body: webhook,
      } as Request;

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
          ignored: true,
          reason: "Status not captured: pending",
        })
      );
    });
  });
});