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
  AddOnStatus,
} from "../../generated/prisma-client";
import { PaymentWebhookService } from "../../services/subscription/first-subscription-webhook";
import axios from "axios";

// Mock email services
vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
  },
}));

// Mock axios for MamoPay API calls
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));

describe.skip("Subscription Webhook - Addon Purchase", () => {
  // Initialize Prisma for test environment
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  beforeAll(async () => {
    // Verify we're using the test database
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(
      `\n🔧 Running addon webhook tests against database: ${dbName}\n`
    );

    // Setup environment variables
    process.env.JWT_SECRET = "test-secret";
    process.env.FRONTEND_URL = "https://test.example.com";
    process.env.SENDGRID_API_KEY = "test-key";
    process.env.SENDGRID_FROM_EMAIL = "test@example.com";
  });

  afterAll(async () => {
    // Final cleanup and disconnect
    try {
      await prisma.addOn.deleteMany({});
      await prisma.balanceTransaction.deleteMany({});
      await prisma.payment.deleteMany({});
      await prisma.subscription.deleteMany({});
      await prisma.domain.deleteMany({});
      await prisma.workspace.deleteMany({});
      await prisma.affiliateLink.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.warn("Cleanup error in afterAll:", error);
    }
    await prismaClient.$disconnect();
  });

  beforeEach(async () => {
    // Clear relevant tables in correct order (respecting foreign keys)
    try {
      await prisma.addOn.deleteMany({});
      await prisma.balanceTransaction.deleteMany({});
      await prisma.payment.deleteMany({});
      await prisma.subscription.deleteMany({});
      await prisma.domain.deleteMany({});
      await prisma.workspace.deleteMany({});
      await prisma.affiliateLink.deleteMany({});
      await prisma.user.deleteMany({});
    } catch (error) {
      console.warn("Cleanup error in beforeEach:", error);
    }

    vi.clearAllMocks();

    // Mock MamoPay API - getSubscribers returns subscriberId
    vi.mocked(axios.get).mockResolvedValue({
      data: [
        {
          id: "MPB-SUBSCRIBER-ADDON-TEST",
          status: "Active",
          customer: {
            id: "CUS-TEST",
            name: "Test User",
            email: "test@example.com",
          },
          number_of_payments: 0,
          total_paid: "AED 0.00",
          next_payment_date: new Date().toISOString(),
        },
      ],
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });
  });

  describe("User-Level Addon (EXTRA_WORKSPACE)", () => {
    it("should create addon for EXTRA_WORKSPACE with null workspaceId", async () => {
      // Arrange - Create verified user
      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `test${timestamp}@example.com`,
          username: `testuser${timestamp}`,
          firstName: "Test",
          lastName: "User",
          password: "hashed-password",
          verified: true,
          plan: UserPlan.BUSINESS,
        },
      });

      // Arrange - Mock webhook payload
      const webhookPayload = {
        status: "captured",
        id: `PAY-TEST-${timestamp}`,
        amount: 1018.98, // 999 + 2% fee
        amount_currency: "USD",
        refund_amount: 0.0,
        refund_status: "No refund",
        custom_data: {
          details: {
            email: user.email,
            lastName: "User",
            addonType: "EXTRA_WORKSPACE",
            firstName: "Test",
            frequency: "monthly",
            trialDays: 0,
            paymentType: "ADDON_PURCHASE",
            trialEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            frequencyInterval: 1,
          },
        },
        created_date: new Date().toISOString(),
        subscription_id: `MPB-SUB-${timestamp}`,
        customer_details: {
          name: "Test User",
          email: user.email,
          phone_number: "-",
          comment: "-",
        },
        payment_method: {
          card_id: "CARD-TEST",
          type: "CREDIT VISA",
          card_holder_name: "Test User",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2028",
          origin: "International card",
        },
        event_type: "charge.succeeded",
      };

      // Act
      const result = await PaymentWebhookService.processWebhook(webhookPayload);

      // Assert - Response
      expect(result.received).toBe(true);
      expect(result.message).toContain(
        "Addon purchased and activated successfully"
      );
      expect(result.data).toBeDefined();
      expect(result.data?.userId).toBe(user.id);
      expect(result.data?.subscriptionId).toBeDefined();

      // Assert - Payment created
      const payment = await prisma.payment.findUnique({
        where: { transactionId: `PAY-TEST-${timestamp}` },
      });
      expect(payment).toBeDefined();
      expect(payment?.amount).toBe(1018.98);
      expect(payment?.paymentType).toBe("ADDON_PURCHASE");
      expect(payment?.addOnType).toBe("EXTRA_WORKSPACE");
      expect(payment?.addOnQuantity).toBe(1);
      expect(payment?.buyerId).toBe(user.id);
      expect(payment?.workspaceId).toBeNull(); // User-level addon

      // Assert - AddOn created
      const addon = await prisma.addOn.findFirst({
        where: { userId: user.id },
      });
      expect(addon).toBeDefined();
      expect(addon?.type).toBe(AddOnType.EXTRA_WORKSPACE);
      expect(addon?.quantity).toBe(1);
      expect(addon?.pricePerUnit).toBe(999); // Original price without fee
      expect(addon?.status).toBe(AddOnStatus.ACTIVE);
      expect(addon?.workspaceId).toBeNull(); // User-level addon
      expect(addon?.billingCycle).toBe("MONTH");

      // Assert - Payment linked to addon
      expect(payment?.addOnId).toBe(addon?.id);

      // Assert - Subscription created
      const subscription = await prisma.subscription.findFirst({
        where: { userId: user.id },
      });
      expect(subscription).toBeDefined();
      expect(subscription?.itemType).toBe("ADDON");
      expect(subscription?.addonType).toBe(AddOnType.EXTRA_WORKSPACE);
      expect(subscription?.subscriptionType).toBeNull();
      expect(subscription?.status).toBe("ACTIVE");
      expect(subscription?.intervalUnit).toBe("MONTH");
      expect(subscription?.intervalCount).toBe(1);
    });

    it("should calculate correct price without processing fee", async () => {
      // Arrange
      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `test${timestamp}@example.com`,
          username: `testuser${timestamp}`,
          firstName: "Test",
          lastName: "User",
          password: "hashed-password",
          verified: true,
          plan: UserPlan.BUSINESS,
        },
      });

      const webhookPayload = {
        status: "captured",
        id: `PAY-TEST-${timestamp}`,
        amount: 1018.98, // 999 + 2% fee
        amount_currency: "USD",
        custom_data: {
          details: {
            email: user.email,
            lastName: "User",
            addonType: "EXTRA_WORKSPACE",
            firstName: "Test",
            frequency: "monthly",
            paymentType: "ADDON_PURCHASE",
            trialEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            frequencyInterval: 1,
          },
        },
        created_date: new Date().toISOString(),
        customer_details: {
          name: "Test User",
          email: user.email,
          phone_number: "-",
        },
        payment_method: {
          type: "CREDIT VISA",
          card_holder_name: "Test User",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2028",
          origin: "International card",
        },
        event_type: "charge.succeeded",
      };

      // Act
      await PaymentWebhookService.processWebhook(webhookPayload);

      // Assert
      const addon = await prisma.addOn.findFirst({
        where: { userId: user.id },
      });
      expect(addon?.pricePerUnit).toBe(999); // 1018.98 / 1.02 = 999
    });
  });

  describe("Workspace-Level Addon (EXTRA_ADMIN, EXTRA_FUNNEL, etc.)", () => {
    it("should create addon for EXTRA_FUNNEL with workspaceId", async () => {
      // Arrange - Create user and workspace
      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `test${timestamp}@example.com`,
          username: `testuser${timestamp}`,
          firstName: "Test",
          lastName: "User",
          password: "hashed-password",
          verified: true,
          plan: UserPlan.BUSINESS,
        },
      });

      const workspace = await prisma.workspace.create({
        data: {
          name: "Test Workspace",
          slug: `test-workspace-${timestamp}`,
          ownerId: user.id,
          planType: UserPlan.BUSINESS,
          status: "ACTIVE",
        },
      });

      const webhookPayload = {
        status: "captured",
        id: `PAY-TEST-${timestamp}`,
        amount: 15.3, // 15 + 2% fee
        amount_currency: "USD",
        custom_data: {
          details: {
            email: user.email,
            lastName: "User",
            addonType: "EXTRA_FUNNEL",
            firstName: "Test",
            frequency: "monthly",
            paymentType: "ADDON_PURCHASE",
            trialEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            frequencyInterval: 1,
            workspaceId: workspace.id,
            workspaceName: workspace.name,
          },
        },
        created_date: new Date().toISOString(),
        customer_details: {
          name: "Test User",
          email: user.email,
          phone_number: "-",
        },
        payment_method: {
          type: "CREDIT VISA",
          card_holder_name: "Test User",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2028",
          origin: "International card",
        },
        event_type: "charge.succeeded",
      };

      // Act
      const result = await PaymentWebhookService.processWebhook(webhookPayload);

      // Assert
      expect(result.received).toBe(true);

      const addon = await prisma.addOn.findFirst({
        where: { userId: user.id },
      });
      expect(addon).toBeDefined();
      expect(addon?.type).toBe(AddOnType.EXTRA_FUNNEL);
      expect(addon?.workspaceId).toBe(workspace.id); // Workspace-level addon
      expect(addon?.pricePerUnit).toBe(15); // 15.3 / 1.02 = 15

      const payment = await prisma.payment.findUnique({
        where: { transactionId: `PAY-TEST-${timestamp}` },
      });
      expect(payment?.workspaceId).toBe(workspace.id);

      // Assert - Subscription created for workspace-level addon
      const subscription = await prisma.subscription.findFirst({
        where: { userId: user.id },
      });
      expect(subscription).toBeDefined();
      expect(subscription?.itemType).toBe("ADDON");
      expect(subscription?.addonType).toBe(AddOnType.EXTRA_FUNNEL);
      expect(subscription?.subscriptionType).toBeNull();
    });
  });

  describe("Referral Commission", () => {
    it("should calculate and add commission to referrer pending balance", async () => {
      // Arrange - Create referrer
      const timestamp = Date.now();
      const referrer = await prisma.user.create({
        data: {
          email: `referrer${timestamp}@example.com`,
          username: `referrer${timestamp}`,
          firstName: "Referrer",
          lastName: "User",
          password: "hashed-password",
          verified: true,
          plan: UserPlan.AGENCY, // Must be AGENCY to have affiliate link
          commissionPercentage: 10, // 10% commission
          pendingBalance: 0,
        },
      });

      // Arrange - Create workspace for referrer (required for affiliate link)
      const referrerWorkspace = await prisma.workspace.create({
        data: {
          name: "Referrer Workspace",
          slug: `referrer-workspace-${timestamp}`,
          ownerId: referrer.id,
          planType: UserPlan.AGENCY,
          status: "ACTIVE",
        },
      });

      // Arrange - Create affiliate link for referrer
      const affiliateLink = await prisma.affiliateLink.create({
        data: {
          name: "Test Affiliate Link",
          token: `REF-${timestamp}`,
          itemType: UserPlan.BUSINESS,
          userId: referrer.id,
          workspaceId: referrerWorkspace.id,
        },
      });

      // Arrange - Create buyer with referral link
      const buyer = await prisma.user.create({
        data: {
          email: `buyer${timestamp}@example.com`,
          username: `buyer${timestamp}`,
          firstName: "Buyer",
          lastName: "User",
          password: "hashed-password",
          verified: true,
          plan: UserPlan.BUSINESS,
          referralLinkUsedId: affiliateLink.id,
        },
      });

      const webhookPayload = {
        status: "captured",
        id: `PAY-TEST-${timestamp}`,
        amount: 1018.98, // 999 + 2% fee
        amount_currency: "USD",
        custom_data: {
          details: {
            email: buyer.email,
            lastName: "User",
            addonType: "EXTRA_WORKSPACE",
            firstName: "Buyer",
            frequency: "monthly",
            paymentType: "ADDON_PURCHASE",
            trialEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            frequencyInterval: 1,
          },
        },
        created_date: new Date().toISOString(),
        customer_details: {
          name: "Buyer User",
          email: buyer.email,
          phone_number: "-",
        },
        payment_method: {
          type: "CREDIT VISA",
          card_holder_name: "Buyer User",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2028",
          origin: "International card",
        },
        event_type: "charge.succeeded",
      };

      // Act
      await PaymentWebhookService.processWebhook(webhookPayload);

      // Assert - Referrer's pending balance updated
      const updatedReferrer = await prisma.user.findUnique({
        where: { id: referrer.id },
      });
      const expectedCommission = 999 * 0.1; // 10% of 999 = 99.9
      expect(updatedReferrer?.pendingBalance).toBe(expectedCommission);

      // Assert - Payment record has commission fields set
      const payment = await prisma.payment.findFirst({
        where: { transactionId: webhookPayload.id },
      });
      expect(payment).toBeDefined();
      expect(payment?.affiliateLinkId).toBe(affiliateLink.id);
      expect(payment?.commissionAmount).toBe(expectedCommission);
      expect(payment?.commissionStatus).toBe("PENDING");
      expect(payment?.commissionHeldUntil).toBeInstanceOf(Date);
      expect(payment?.affiliatePaid).toBe(false);

      // Assert - Balance transaction created (COMMISSION_HOLD type)
      const balanceTransaction = await prisma.balanceTransaction.findFirst({
        where: { userId: referrer.id },
      });
      expect(balanceTransaction).toBeDefined();
      expect(balanceTransaction?.type).toBe("COMMISSION_HOLD");
      expect(balanceTransaction?.amount).toBe(expectedCommission);
      expect(balanceTransaction?.balanceBefore).toBe(0);
      expect(balanceTransaction?.balanceAfter).toBe(0); // Available balance unchanged
      expect(balanceTransaction?.referenceType).toBe("Payment");
      expect(balanceTransaction?.notes).toContain(buyer.email);
      expect(balanceTransaction?.notes).toContain("EXTRA_WORKSPACE");
      expect(balanceTransaction?.releasedAt).toBeNull(); // Not released yet

      // Assert - Subscription created
      const subscription = await prisma.subscription.findFirst({
        where: { userId: buyer.id },
      });
      expect(subscription).toBeDefined();
      expect(subscription?.itemType).toBe("ADDON");
      expect(subscription?.addonType).toBe(AddOnType.EXTRA_WORKSPACE);
      expect(subscription?.subscriptionType).toBeNull();
    });
  });

  describe("MamoPay Integration for Addon Purchase", () => {
    it("should fetch and store subscriberId for addon subscription", async () => {
      // Arrange
      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `addon-mamopay-${timestamp}@example.com`,
          username: `addonmamopay${timestamp}`,
          firstName: "Addon",
          lastName: "MamoPay",
          password: "hashed-password",
          verified: true,
          plan: UserPlan.BUSINESS,
        },
      });

      const webhookPayload = {
        status: "captured",
        id: `PAY-ADDON-MAMOPAY-${timestamp}`,
        amount: 1018.98,
        amount_currency: "USD",
        subscription_id: `MPB-SUB-ADDON-${timestamp}`,
        custom_data: {
          details: {
            email: user.email,
            lastName: "MamoPay",
            addonType: "EXTRA_WORKSPACE",
            firstName: "Addon",
            frequency: "monthly",
            paymentType: "ADDON_PURCHASE",
            trialEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            frequencyInterval: 1,
          },
        },
        created_date: new Date().toISOString(),
        customer_details: {
          name: "Addon MamoPay",
          email: user.email,
          phone_number: "-",
        },
        payment_method: {
          type: "CREDIT VISA",
          card_holder_name: "Addon MamoPay",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2028",
          origin: "International card",
        },
        event_type: "charge.succeeded",
      };

      // Act
      const result = await PaymentWebhookService.processWebhook(webhookPayload);

      // Assert - Webhook processed
      expect(result.received).toBe(true);

      // Assert - MamoPay API was called
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining(
          `/subscriptions/MPB-SUB-ADDON-${timestamp}/subscribers`
        ),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Bearer"),
          }),
        })
      );

      // Assert - subscriberId stored in subscription
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          subscriptionId: `MPB-SUB-ADDON-${timestamp}`,
        },
      });

      expect(subscription).toBeDefined();
      expect(subscription?.subscriberId).toBe("MPB-SUBSCRIBER-ADDON-TEST");
      expect(subscription?.itemType).toBe("ADDON");
      expect(subscription?.addonType).toBe(AddOnType.EXTRA_WORKSPACE);
    });

    it("should handle MamoPay API failure gracefully for addon", async () => {
      // Arrange - Mock MamoPay to fail
      vi.mocked(axios.get).mockRejectedValueOnce(
        new Error("MamoPay API error")
      );

      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `addon-fail-${timestamp}@example.com`,
          username: `addonfail${timestamp}`,
          firstName: "Addon",
          lastName: "Fail",
          password: "hashed-password",
          verified: true,
          plan: UserPlan.BUSINESS,
        },
      });

      const webhookPayload = {
        status: "captured",
        id: `PAY-ADDON-FAIL-${timestamp}`,
        amount: 1018.98,
        amount_currency: "USD",
        subscription_id: `MPB-SUB-FAIL-${timestamp}`,
        custom_data: {
          details: {
            email: user.email,
            lastName: "Fail",
            addonType: "EXTRA_WORKSPACE",
            firstName: "Addon",
            frequency: "monthly",
            paymentType: "ADDON_PURCHASE",
            trialEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            frequencyInterval: 1,
          },
        },
        created_date: new Date().toISOString(),
        customer_details: {
          name: "Addon Fail",
          email: user.email,
          phone_number: "-",
        },
        payment_method: {
          type: "CREDIT VISA",
          card_holder_name: "Addon Fail",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2028",
          origin: "International card",
        },
        event_type: "charge.succeeded",
      };

      // Act - Should not throw
      const result = await PaymentWebhookService.processWebhook(webhookPayload);

      // Assert - Webhook still processed
      expect(result.received).toBe(true);

      // Assert - Subscription created without subscriberId
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          subscriptionId: `MPB-SUB-FAIL-${timestamp}`,
        },
      });

      expect(subscription).toBeDefined();
      expect(subscription?.subscriberId).toBeNull();

      // Assert - Addon still created
      const addon = await prisma.addOn.findFirst({
        where: { userId: user.id },
      });
      expect(addon).toBeDefined();
      expect(addon?.status).toBe(AddOnStatus.ACTIVE);

      // Reset mock
      vi.mocked(axios.get).mockResolvedValue({
        data: [
          {
            id: "MPB-SUBSCRIBER-ADDON-TEST",
            status: "Active",
            customer: {
              id: "CUS-TEST",
              name: "Test User",
              email: "test@example.com",
            },
            number_of_payments: 0,
            total_paid: "AED 0.00",
            next_payment_date: new Date().toISOString(),
          },
        ],
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });
    });

    it("should skip MamoPay fetch when subscription_id is missing for addon", async () => {
      // Arrange
      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `addon-nosub-${timestamp}@example.com`,
          username: `addonnosub${timestamp}`,
          firstName: "Addon",
          lastName: "NoSub",
          password: "hashed-password",
          verified: true,
          plan: UserPlan.BUSINESS,
        },
      });

      const webhookPayload = {
        status: "captured",
        id: `PAY-ADDON-NOSUB-${timestamp}`,
        amount: 1018.98,
        amount_currency: "USD",
        subscription_id: null, // No subscription_id
        custom_data: {
          details: {
            email: user.email,
            lastName: "NoSub",
            addonType: "EXTRA_WORKSPACE",
            firstName: "Addon",
            frequency: "monthly",
            paymentType: "ADDON_PURCHASE",
            trialEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            frequencyInterval: 1,
          },
        },
        created_date: new Date().toISOString(),
        customer_details: {
          name: "Addon NoSub",
          email: user.email,
          phone_number: "-",
        },
        payment_method: {
          type: "CREDIT VISA",
          card_holder_name: "Addon NoSub",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2028",
          origin: "International card",
        },
        event_type: "charge.succeeded",
      };

      // Clear mocks
      vi.clearAllMocks();

      // Act
      const result = await PaymentWebhookService.processWebhook(webhookPayload);

      // Assert - Webhook processed
      expect(result.received).toBe(true);

      // Assert - MamoPay API NOT called
      expect(axios.get).not.toHaveBeenCalled();

      // Assert - Subscription created with null subscriberId
      const subscription = await prisma.subscription.findFirst({
        where: { userId: user.id },
      });

      expect(subscription).toBeDefined();
      expect(subscription?.subscriberId).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should reject if user not found", async () => {
      const webhookPayload = {
        status: "captured",
        id: `PAY-TEST-${Date.now()}`,
        amount: 1018.98,
        amount_currency: "USD",
        custom_data: {
          details: {
            email: "nonexistent@example.com",
            lastName: "User",
            addonType: "EXTRA_WORKSPACE",
            firstName: "Test",
            frequency: "monthly",
            paymentType: "ADDON_PURCHASE",
            trialEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            frequencyInterval: 1,
          },
        },
        created_date: new Date().toISOString(),
        customer_details: {
          name: "Test User",
          email: "nonexistent@example.com",
          phone_number: "-",
        },
        payment_method: {
          type: "CREDIT VISA",
          card_holder_name: "Test User",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2028",
          origin: "International card",
        },
        event_type: "charge.succeeded",
      };

      await expect(
        PaymentWebhookService.processWebhook(webhookPayload)
      ).rejects.toThrow("User not found");
    });

    it("should reject duplicate webhook (same transaction ID)", async () => {
      // Arrange
      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `test${timestamp}@example.com`,
          username: `testuser${timestamp}`,
          firstName: "Test",
          lastName: "User",
          password: "hashed-password",
          verified: true,
          plan: UserPlan.BUSINESS,
        },
      });

      const webhookPayload = {
        status: "captured",
        id: `PAY-TEST-${timestamp}`,
        amount: 1018.98,
        amount_currency: "USD",
        custom_data: {
          details: {
            email: user.email,
            lastName: "User",
            addonType: "EXTRA_WORKSPACE",
            firstName: "Test",
            frequency: "monthly",
            paymentType: "ADDON_PURCHASE",
            trialEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            frequencyInterval: 1,
          },
        },
        created_date: new Date().toISOString(),
        customer_details: {
          name: "Test User",
          email: user.email,
          phone_number: "-",
        },
        payment_method: {
          type: "CREDIT VISA",
          card_holder_name: "Test User",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2028",
          origin: "International card",
        },
        event_type: "charge.succeeded",
      };

      // Act - Process webhook first time
      const result1 = await PaymentWebhookService.processWebhook(
        webhookPayload
      );
      expect(result1.received).toBe(true);

      // Act - Process webhook second time (duplicate)
      const result2 = await PaymentWebhookService.processWebhook(
        webhookPayload
      );

      // Assert - Second webhook ignored
      expect(result2.received).toBe(true);
      expect(result2.ignored).toBe(true);
      expect(result2.reason).toContain("already processed");
    });
  });
});
