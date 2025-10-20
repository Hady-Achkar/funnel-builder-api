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
import {
  PrismaClient,
  UserPlan,
  AddOnType,
} from "../../generated/prisma-client";
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

describe("Renewal Webhook - Addon Renewal", () => {
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  beforeAll(async () => {
    // Setup test environment
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(
      `\n🔧 Running addon renewal tests against database: ${dbName}\n`
    );

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
      await prisma.addOn.deleteMany({});
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
      await prisma.addOn.deleteMany({});
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
          id: "MPB-SUBSCRIBER-ADDON-RENEWAL",
          status: "Active",
          customer: {
            id: "CUS-ADDON-RENEWAL",
            name: "Test Addon User",
            email: "addon@test.com",
          },
        },
      ],
    });
  });

  describe("Domain Addon Renewal", () => {
    it("should renew DOMAIN addon monthly subscription", async () => {
      // Arrange - Create existing user with BUSINESS plan
      const existingUser = await prisma.user.create({
        data: {
          email: "domain-addon@test.com",
          username: "domainaddon",
          firstName: "Domain",
          lastName: "Addon",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-02-01"),
        },
      });

      // Create existing subscription for addon
      const currentEndDate = new Date("2025-01-20");
      const existingSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-ADDON-DOMAIN-001",
          userId: existingUser.id,
          startsAt: new Date("2024-01-20"),
          endsAt: currentEndDate,
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "ADDON",
          subscriptionType: null,
          addonType: AddOnType.EXTRA_CUSTOM_DOMAIN, // Addon type stored in subscription
          rawData: [
            {
              event_type: "charge.succeeded",
              id: "PAY-INITIAL-ADDON-001",
            },
          ],
        },
      });

      // Create addon (separate table, no subscriptionId or rawData)
      const existingAddon = await prisma.addOn.create({
        data: {
          userId: existingUser.id,
          type: AddOnType.EXTRA_CUSTOM_DOMAIN,
          quantity: 1,
          pricePerUnit: 10.0,
          status: "ACTIVE",
          billingCycle: "MONTH",
          startDate: new Date("2024-01-20"),
          endDate: currentEndDate,
        },
      });

      // Create renewal webhook payload
      const renewalWebhook = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-RENEWAL-ADDON-DOMAIN-001",
        amount: 10.2, // $10 + 2% fee
        amount_currency: "USD",
        subscription_id: "MPB-SUB-ADDON-DOMAIN-001",
        next_payment_date: "20/02/2025", // DD/MM/YYYY format
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "domain-addon@test.com",
            firstName: "Domain",
            lastName: "Addon",
            addonType: "EXTRA_CUSTOM_DOMAIN",
            frequency: "monthly",
            paymentType: "ADDON_PURCHASE",
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Domain Addon",
          email: "domain-addon@test.com",
          phone_number: "+1234567890",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST",
          type: "CREDIT VISA",
          card_holder_name: "Domain Addon",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
        settlement_amount: "37.40",
        settlement_currency: "AED",
        settlement_date: "2025-10-27",
        settlement_fee: "AED 0.44",
        settlement_vat: "AED 0.02",
        payment_link_id: "MB-LINK-ADDON",
        payment_link_url: "https://test.mamopay.com/pay/addon",
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

      // Assert - Response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
          message: "Addon renewed successfully",
          data: expect.objectContaining({
            userId: existingUser.id,
            subscriptionId: existingSubscription.id,
            addonId: existingAddon.id,
          }),
        })
      );

      // Assert - Payment record created
      const payments = await prisma.payment.findMany({
        where: { buyerId: existingUser.id },
      });
      expect(payments).toHaveLength(1);
      expect(payments[0]).toMatchObject({
        transactionId: "PAY-RENEWAL-ADDON-DOMAIN-001",
        amount: 10.2,
        currency: "USD",
        status: "captured",
        itemType: null, // itemType is for plan purchases
        addOnType: AddOnType.EXTRA_CUSTOM_DOMAIN, // addon type is in addOnType field
        paymentType: "ADDON_PURCHASE",
        buyerId: existingUser.id,
        addOnId: existingAddon.id,
        affiliateLinkId: null,
        commissionAmount: null,
        commissionStatus: null,
      });

      // Assert - Subscription updated
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: existingSubscription.id },
      });
      expect(updatedSubscription?.endsAt.toISOString().split("T")[0]).toBe(
        "2025-02-20"
      );
      expect(updatedSubscription?.status).toBe("ACTIVE");

      // Assert - rawData accumulated in subscription
      const subscriptionRawData = updatedSubscription?.rawData as any[];
      expect(subscriptionRawData).toHaveLength(2);
      expect(subscriptionRawData[0].id).toBe("PAY-INITIAL-ADDON-001");
      expect(subscriptionRawData[1].id).toBe("PAY-RENEWAL-ADDON-DOMAIN-001");

      // Assert - Addon updated (no rawData in AddOn model)
      const updatedAddon = await prisma.addOn.findUnique({
        where: { id: existingAddon.id },
      });
      expect(updatedAddon?.endDate.toISOString().split("T")[0]).toBe(
        "2025-02-20"
      );
      expect(updatedAddon?.status).toBe("ACTIVE");

      // Assert - User trialEndDate NOT changed (addons don't affect user trial)
      const updatedUser = await prisma.user.findUnique({
        where: { id: existingUser.id },
      });
      expect(updatedUser?.trialEndDate?.toISOString().split("T")[0]).toBe(
        "2025-02-01"
      );

      // Assert - Email sent
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "domain-addon@test.com",
          subject: expect.stringContaining("Addon Renewed - Domain"),
        })
      );
    });

    it("should renew WORKSPACE addon monthly subscription", async () => {
      // Arrange - Create existing user with BUSINESS plan
      const existingUser = await prisma.user.create({
        data: {
          email: "workspace-addon@test.com",
          username: "workspaceaddon",
          firstName: "Workspace",
          lastName: "Addon",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-02-01"),
        },
      });

      // Create existing subscription with addon
      const currentEndDate = new Date("2025-01-20");
      const existingSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-ADDON-WORKSPACE-001",
          userId: existingUser.id,
          startsAt: new Date("2024-01-20"),
          endsAt: currentEndDate,
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "ADDON",
          subscriptionType: null,
          addonType: AddOnType.EXTRA_WORKSPACE, // Addon type stored in subscription
          rawData: [
            {
              event_type: "charge.succeeded",
              id: "PAY-INITIAL-WORKSPACE-001",
            },
          ],
        },
      });

      // Create addon (no subscriptionId or rawData fields in AddOn model)
      const existingAddon = await prisma.addOn.create({
        data: {
          userId: existingUser.id,
          type: AddOnType.EXTRA_WORKSPACE,
          quantity: 1,
          pricePerUnit: 5.0,
          status: "ACTIVE",
          billingCycle: "MONTH",
          startDate: new Date("2024-01-20"),
          endDate: currentEndDate,
        },
      });

      // Create renewal webhook payload
      const renewalWebhook = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-RENEWAL-ADDON-WORKSPACE-001",
        amount: 5.1, // $5 + 2% fee
        amount_currency: "USD",
        subscription_id: "MPB-SUB-ADDON-WORKSPACE-001",
        next_payment_date: "20/02/2025",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "workspace-addon@test.com",
            firstName: "Workspace",
            lastName: "Addon",
            addonType: "EXTRA_WORKSPACE",
            frequency: "monthly",
            paymentType: "ADDON_PURCHASE",
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Workspace Addon",
          email: "workspace-addon@test.com",
          phone_number: "+1234567890",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST",
          type: "CREDIT VISA",
          card_holder_name: "Workspace Addon",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
        settlement_amount: "18.70",
        settlement_currency: "AED",
        settlement_date: "2025-10-27",
        settlement_fee: "AED 0.22",
        settlement_vat: "AED 0.01",
        payment_link_id: "MB-LINK-ADDON",
        payment_link_url: "https://test.mamopay.com/pay/addon",
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

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200);

      // Assert - Addon updated with WORKSPACE type
      const updatedAddon = await prisma.addOn.findUnique({
        where: { id: existingAddon.id },
      });
      expect(updatedAddon?.type).toBe(AddOnType.EXTRA_WORKSPACE);
      expect(updatedAddon?.endDate.toISOString().split("T")[0]).toBe(
        "2025-02-20"
      );
      expect(updatedAddon?.status).toBe("ACTIVE");

      // Assert - Email sent with WORKSPACE type
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "workspace-addon@test.com",
          subject: expect.stringContaining("Addon Renewed - Workspace"),
        })
      );
    });

    it("should reactivate subscription and addon even if both were EXPIRED", async () => {
      // Arrange - Create user
      const existingUser = await prisma.user.create({
        data: {
          email: "expired-addon@test.com",
          username: "expiredaddon",
          firstName: "Expired",
          lastName: "Addon",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-02-01"),
        },
      });

      // Create EXPIRED subscription
      const currentEndDate = new Date("2024-12-20"); // Past date
      const existingSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-EXPIRED-ADDON-001",
          userId: existingUser.id,
          startsAt: new Date("2023-12-20"),
          endsAt: currentEndDate,
          status: "EXPIRED", // Expired status
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "ADDON",
          subscriptionType: null,
          addonType: AddOnType.EXTRA_CUSTOM_DOMAIN, // Addon type stored in subscription
          rawData: [
            {
              event_type: "charge.succeeded",
              id: "PAY-INITIAL-EXPIRED-001",
            },
          ],
        },
      });

      // Create EXPIRED addon
      const existingAddon = await prisma.addOn.create({
        data: {
          userId: existingUser.id,
          type: AddOnType.EXTRA_CUSTOM_DOMAIN,
          quantity: 1,
          pricePerUnit: 10.0,
          status: "EXPIRED", // Expired status
          billingCycle: "MONTH",
          startDate: new Date("2023-12-20"),
          endDate: currentEndDate,
        },
      });

      // Create renewal webhook
      const renewalWebhook = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-RENEWAL-EXPIRED-ADDON-001",
        amount: 10.2,
        amount_currency: "USD",
        subscription_id: "MPB-SUB-EXPIRED-ADDON-001",
        next_payment_date: "20/02/2025",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "expired-addon@test.com",
            firstName: "Expired",
            lastName: "Addon",
            addonType: "EXTRA_CUSTOM_DOMAIN",
            frequency: "monthly",
            paymentType: "ADDON_PURCHASE",
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Expired Addon",
          email: "expired-addon@test.com",
          phone_number: "+1234567890",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST",
          type: "CREDIT VISA",
          card_holder_name: "Expired Addon",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
        settlement_amount: "37.40",
        settlement_currency: "AED",
        settlement_date: "2025-10-27",
        settlement_fee: "AED 0.44",
        settlement_vat: "AED 0.02",
        payment_link_id: "MB-LINK-ADDON",
        payment_link_url: "https://test.mamopay.com/pay/addon",
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

      // Assert - Both reactivated
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: existingSubscription.id },
      });
      expect(updatedSubscription?.status).toBe("ACTIVE");
      expect(updatedSubscription?.endsAt.toISOString().split("T")[0]).toBe(
        "2025-02-20"
      );

      const updatedAddon = await prisma.addOn.findUnique({
        where: { id: existingAddon.id },
      });
      expect(updatedAddon?.status).toBe("ACTIVE");
      expect(updatedAddon?.endDate.toISOString().split("T")[0]).toBe(
        "2025-02-20"
      );
    });

    it("should accumulate rawData for both subscription and addon with multiple renewals", async () => {
      // Arrange - Create user and addon subscription
      const existingUser = await prisma.user.create({
        data: {
          email: "multi-renewal@test.com",
          username: "multirenewal",
          firstName: "Multi",
          lastName: "Renewal",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-03-01"),
        },
      });

      const existingSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-MULTI-ADDON-001",
          userId: existingUser.id,
          startsAt: new Date("2024-01-20"),
          endsAt: new Date("2025-01-20"),
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "ADDON",
          subscriptionType: null,
          addonType: AddOnType.EXTRA_CUSTOM_DOMAIN, // Addon type stored in subscription
          rawData: [
            {
              event_type: "charge.succeeded",
              id: "PAY-INITIAL",
            },
          ],
        },
      });

      const existingAddon = await prisma.addOn.create({
        data: {
          userId: existingUser.id,
          type: AddOnType.EXTRA_CUSTOM_DOMAIN,
          quantity: 1,
          pricePerUnit: 10.0,
          status: "ACTIVE",
          billingCycle: "MONTH",
          startDate: new Date("2024-01-20"),
          endDate: new Date("2025-01-20"),
        },
      });

      // First renewal
      const firstRenewal = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-RENEWAL-1",
        amount: 10.2,
        amount_currency: "USD",
        subscription_id: "MPB-SUB-MULTI-ADDON-001",
        next_payment_date: "20/02/2025",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "multi-renewal@test.com",
            firstName: "Multi",
            lastName: "Renewal",
            addonType: "EXTRA_CUSTOM_DOMAIN",
            frequency: "monthly",
            paymentType: "ADDON_PURCHASE",
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Multi Renewal",
          email: "multi-renewal@test.com",
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "CREDIT VISA",
          card_holder_name: "Multi Renewal",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
      };

      const mockReq1 = { body: firstRenewal } as Request;
      const mockRes1 = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const mockNext1 = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(
        mockReq1,
        mockRes1,
        mockNext1
      );

      // Check after first renewal - only subscription has rawData
      const afterFirst = await prisma.subscription.findUnique({
        where: { id: existingSubscription.id },
      });
      const afterFirstAddon = await prisma.addOn.findUnique({
        where: { id: existingAddon.id },
      });

      const subscriptionRawDataAfterFirst = afterFirst?.rawData as any[];

      expect(subscriptionRawDataAfterFirst).toHaveLength(2);
      expect(subscriptionRawDataAfterFirst[0].id).toBe("PAY-INITIAL");
      expect(subscriptionRawDataAfterFirst[1].id).toBe("PAY-RENEWAL-1");

      // Assert addon is still active and endDate updated
      expect(afterFirstAddon?.status).toBe("ACTIVE");
      expect(afterFirstAddon?.endDate.toISOString().split("T")[0]).toBe(
        "2025-02-20"
      );

      // Second renewal
      vi.clearAllMocks(); // Clear payment duplicate check

      const secondRenewal = {
        ...firstRenewal,
        id: "PAY-RENEWAL-2",
        next_payment_date: "20/03/2025",
      };

      const mockReq2 = { body: secondRenewal } as Request;
      const mockRes2 = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const mockNext2 = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(
        mockReq2,
        mockRes2,
        mockNext2
      );

      // Check after second renewal - only subscription has rawData
      const afterSecond = await prisma.subscription.findUnique({
        where: { id: existingSubscription.id },
      });
      const afterSecondAddon = await prisma.addOn.findUnique({
        where: { id: existingAddon.id },
      });

      const subscriptionRawDataAfterSecond = afterSecond?.rawData as any[];

      expect(subscriptionRawDataAfterSecond).toHaveLength(3);
      expect(subscriptionRawDataAfterSecond[0].id).toBe("PAY-INITIAL");
      expect(subscriptionRawDataAfterSecond[1].id).toBe("PAY-RENEWAL-1");
      expect(subscriptionRawDataAfterSecond[2].id).toBe("PAY-RENEWAL-2");

      // Assert addon is still active and endDate updated
      expect(afterSecondAddon?.status).toBe("ACTIVE");
      expect(afterSecondAddon?.endDate.toISOString().split("T")[0]).toBe(
        "2025-03-20"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should ignore duplicate addon renewal payment", async () => {
      // Arrange - Create user, subscription, and addon
      const existingUser = await prisma.user.create({
        data: {
          email: "duplicate-addon@test.com",
          username: "duplicateaddon",
          firstName: "Duplicate",
          lastName: "Addon",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-02-01"),
        },
      });

      const existingSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-DUP-ADDON-001",
          userId: existingUser.id,
          startsAt: new Date("2024-01-20"),
          endsAt: new Date("2025-01-20"),
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "ADDON",
          subscriptionType: null,
          addonType: AddOnType.EXTRA_CUSTOM_DOMAIN, // Addon type stored in subscription
          rawData: [],
        },
      });

      await prisma.addOn.create({
        data: {
          userId: existingUser.id,
          type: AddOnType.EXTRA_CUSTOM_DOMAIN,
          quantity: 1,
          pricePerUnit: 10.0,
          status: "ACTIVE",
          billingCycle: "MONTH",
          startDate: new Date("2024-01-20"),
          endDate: new Date("2025-01-20"),
        },
      });

      // Create existing payment (already processed)
      await prisma.payment.create({
        data: {
          transactionId: "PAY-DUPLICATE-ADDON",
          amount: 10.2,
          currency: "USD",
          status: "captured",
          itemType: null, // itemType is for plan purchases
          addOnType: AddOnType.EXTRA_CUSTOM_DOMAIN, // Use addOnType for addon purchases
          paymentType: "ADDON_PURCHASE",
          buyerId: existingUser.id,
          rawData: [],
        },
      });

      // Attempt duplicate renewal
      const duplicateWebhook = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-DUPLICATE-ADDON", // Same transaction ID
        amount: 10.2,
        amount_currency: "USD",
        subscription_id: "MPB-SUB-DUP-ADDON-001",
        next_payment_date: "20/02/2025",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "duplicate-addon@test.com",
            addonType: "EXTRA_CUSTOM_DOMAIN",
            frequency: "monthly",
            paymentType: "ADDON_PURCHASE",
          },
        },
        customer_details: {
          name: "Duplicate Addon",
          email: "duplicate-addon@test.com",
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "CREDIT VISA",
          card_holder_name: "Duplicate Addon",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
      };

      // Act
      const mockReq = { body: duplicateWebhook } as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Assert - Ignored
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
          ignored: true,
          reason: "Payment already processed",
        })
      );

      // Assert - No duplicate payment created
      const payments = await prisma.payment.findMany({
        where: { buyerId: existingUser.id },
      });
      expect(payments).toHaveLength(1);
    });

    it("should throw error if subscription not found for addon renewal", async () => {
      // Arrange - Webhook for non-existent subscription
      const webhookData = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-NO-SUB-ADDON",
        amount: 10.2,
        amount_currency: "USD",
        subscription_id: "MPB-SUB-NONEXISTENT",
        next_payment_date: "20/02/2025",
        custom_data: {
          details: {
            email: "nosubscription@test.com",
            addonType: "EXTRA_CUSTOM_DOMAIN",
            paymentType: "ADDON_PURCHASE",
          },
        },
        customer_details: {
          name: "No Sub",
          email: "nosubscription@test.com",
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "CREDIT VISA",
          card_holder_name: "No Sub",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
      };

      // Act
      const mockReq = { body: webhookData } as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Assert - Error passed to next middleware
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            "Subscription not found: MPB-SUB-NONEXISTENT"
          ),
        })
      );
    });

    it("should throw error if addon not found for addon renewal", async () => {
      // Arrange - Create subscription without addon
      const existingUser = await prisma.user.create({
        data: {
          email: "noaddon@test.com",
          username: "noaddon",
          firstName: "No",
          lastName: "Addon",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
          trialStartDate: new Date("2024-01-01"),
          trialEndDate: new Date("2025-02-01"),
        },
      });

      await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-NO-ADDON",
          userId: existingUser.id,
          startsAt: new Date("2024-01-20"),
          endsAt: new Date("2025-01-20"),
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "ADDON",
          subscriptionType: null,
          addonType: AddOnType.EXTRA_CUSTOM_DOMAIN, // Addon type stored in subscription
          rawData: [],
        },
      });

      // No addon created!

      const webhookData = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-NO-ADDON",
        amount: 10.2,
        amount_currency: "USD",
        subscription_id: "MPB-SUB-NO-ADDON",
        next_payment_date: "20/02/2025",
        custom_data: {
          details: {
            email: "noaddon@test.com",
            addonType: "EXTRA_CUSTOM_DOMAIN",
            paymentType: "ADDON_PURCHASE",
          },
        },
        customer_details: {
          name: "No Addon",
          email: "noaddon@test.com",
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "CREDIT VISA",
          card_holder_name: "No Addon",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
      };

      // Act
      const mockReq = { body: webhookData } as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            "No addon found for subscription MPB-SUB-NO-ADDON"
          ),
        })
      );
    });

    it("should throw error for invalid date format in addon renewal", async () => {
      // Arrange - Create user, subscription, and addon
      const existingUser = await prisma.user.create({
        data: {
          email: "invaliddate@test.com",
          username: "invaliddate",
          firstName: "Invalid",
          lastName: "Date",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
        },
      });

      const existingSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-INVALID-DATE",
          userId: existingUser.id,
          startsAt: new Date("2024-01-20"),
          endsAt: new Date("2025-01-20"),
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "ADDON",
          subscriptionType: null,
          addonType: AddOnType.EXTRA_CUSTOM_DOMAIN, // Addon type stored in subscription
          rawData: [],
        },
      });

      await prisma.addOn.create({
        data: {
          userId: existingUser.id,
          type: AddOnType.EXTRA_CUSTOM_DOMAIN,
          quantity: 1,
          pricePerUnit: 10.0,
          status: "ACTIVE",
          billingCycle: "MONTH",
          startDate: new Date("2024-01-20"),
          endDate: new Date("2025-01-20"),
        },
      });

      const webhookData = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-INVALID-DATE",
        amount: 10.2,
        amount_currency: "USD",
        subscription_id: "MPB-SUB-INVALID-DATE",
        next_payment_date: "2025-02-20", // Wrong format (YYYY-MM-DD instead of DD/MM/YYYY)
        custom_data: {
          details: {
            email: "invaliddate@test.com",
            addonType: "EXTRA_CUSTOM_DOMAIN",
            paymentType: "ADDON_PURCHASE",
          },
        },
        customer_details: {
          name: "Invalid Date",
          email: "invaliddate@test.com",
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "CREDIT VISA",
          card_holder_name: "Invalid Date",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
      };

      // Act
      const mockReq = { body: webhookData } as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Invalid"),
        })
      );
    });

    it("should continue processing even if email fails for addon renewal", async () => {
      // Arrange - Mock email to fail
      vi.mocked(sgMail.send).mockRejectedValueOnce(
        new Error("SendGrid API error")
      );

      const existingUser = await prisma.user.create({
        data: {
          email: "emailfail@test.com",
          username: "emailfail",
          firstName: "Email",
          lastName: "Fail",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.BUSINESS,
        },
      });

      const existingSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "MPB-SUB-EMAIL-FAIL",
          userId: existingUser.id,
          startsAt: new Date("2024-01-20"),
          endsAt: new Date("2025-01-20"),
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "ADDON",
          subscriptionType: null,
          addonType: AddOnType.EXTRA_CUSTOM_DOMAIN, // Addon type stored in subscription
          rawData: [],
        },
      });

      await prisma.addOn.create({
        data: {
          userId: existingUser.id,
          type: AddOnType.EXTRA_CUSTOM_DOMAIN,
          quantity: 1,
          pricePerUnit: 10.0,
          status: "ACTIVE",
          billingCycle: "MONTH",
          startDate: new Date("2024-01-20"),
          endDate: new Date("2025-01-20"),
        },
      });

      const webhookData = {
        event_type: "subscription.succeeded",
        status: "captured",
        id: "PAY-EMAIL-FAIL",
        amount: 10.2,
        amount_currency: "USD",
        subscription_id: "MPB-SUB-EMAIL-FAIL",
        next_payment_date: "20/02/2025",
        custom_data: {
          details: {
            email: "emailfail@test.com",
            addonType: "EXTRA_CUSTOM_DOMAIN",
            paymentType: "ADDON_PURCHASE",
          },
        },
        customer_details: {
          name: "Email Fail",
          email: "emailfail@test.com",
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "CREDIT VISA",
          card_holder_name: "Email Fail",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "International card",
        },
      };

      // Act
      const mockReq = { body: webhookData } as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const mockNext = vi.fn() as NextFunction;

      await RenewalWebhookController.handleWebhook(mockReq, mockRes, mockNext);

      // Assert - Should still succeed despite email failure
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          received: true,
          message: "Addon renewed successfully",
        })
      );

      // Assert - Payment and updates still created
      const payment = await prisma.payment.findFirst({
        where: { transactionId: "PAY-EMAIL-FAIL" },
      });
      expect(payment).toBeTruthy();
    });
  });
});
