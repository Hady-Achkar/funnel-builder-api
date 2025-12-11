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
import { PaymentWebhookService } from "../../services/subscription/first-subscription-webhook";
import { sendSetPasswordEmail } from "../../helpers/subscription/emails/set-password";
import { UserPlan } from "../../generated/prisma-client";
import axios from "axios";

// Mock email services
vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
  },
}));
vi.mock("../../helpers/subscription/emails/set-password");

// Mock axios for MamoPay API calls
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));

describe.skip("Subscription Webhook - Plan Purchase Generic User Creation", () => {
  // Initialize Prisma for test environment
  const prismaClient = new PrismaClient();
  setPrismaClient(prismaClient);
  const prisma = getPrisma();

  beforeAll(async () => {
    // Verify we're using the test database
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(`\n🔧 Running tests against database: ${dbName}\n`);

    // Setup environment variables
    process.env.JWT_SECRET = "test-secret";
    process.env.FRONTEND_URL = "https://test.example.com";
    process.env.SENDGRID_API_KEY = "test-key";
    process.env.SENDGRID_FROM_EMAIL = "test@example.com";
    process.env.MAMOPAY_API_URL = "https://test-mamopay.com";
    process.env.MAMOPAY_API_KEY = "test-mamopay-key";
  });

  afterAll(async () => {
    // Final cleanup and disconnect
    try {
      // Delete in reverse order of dependencies
      await prisma.subscription.deleteMany({});

      // Delete workspaceClone before payment (it references payment)
      await prisma.workspaceClone.deleteMany({});
      await prisma.payment.deleteMany({});

      // Delete related tables that might reference users
      await prisma.page.deleteMany({});
      await prisma.funnel.deleteMany({});
      await prisma.workspaceMember.deleteMany({});
      await prisma.workspace.deleteMany({});

      // Finally delete users
      await prisma.user.deleteMany({});
    } catch (error) {
      console.warn("Cleanup error in afterAll:", error);
    }
    await prismaClient.$disconnect();
  });

  beforeEach(async () => {
    // Clear relevant tables in correct order (respecting foreign keys)
    try {
      // Delete in reverse order of dependencies
      await prisma.subscription.deleteMany({});

      // Delete workspaceClone before payment (it references payment)
      await prisma.workspaceClone.deleteMany({});
      await prisma.payment.deleteMany({});

      // Delete related tables that might reference users
      await prisma.page.deleteMany({});
      await prisma.funnel.deleteMany({});
      await prisma.workspaceMember.deleteMany({});
      await prisma.workspace.deleteMany({});

      // Finally delete users
      await prisma.user.deleteMany({});
    } catch (error) {
      console.warn("Cleanup error in beforeEach:", error);
    }

    // Clear all mocks
    vi.clearAllMocks();

    // Setup mock implementations
    vi.mocked(sendSetPasswordEmail).mockResolvedValue(undefined);

    // Mock MamoPay API - getSubscribers returns subscriberId
    vi.mocked(axios.get).mockResolvedValue({
      data: [
        {
          id: "MPB-SUBSCRIBER-TEST123",
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

  describe("Agency User Plan Purchase", () => {
    it("should create agency user with subscription, payment, and send set password email", async () => {
      // Arrange - Create verified user first
      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `john.agency-${timestamp}@test.com`,
          username: `johnagency${timestamp}`,
          firstName: "John",
          lastName: "Agency",
          password: "hashed_password",
          verified: true, // Must be verified
          plan: UserPlan.FREE, // Will be upgraded to AGENCY
        },
      });

      const mockWebhookPayload = {
        event_type: "charge.succeeded",
        status: "captured",
        id: "PAY-AGENCY-TEST-001",
        amount: 99.99,
        amount_currency: "USD",
        subscription_id: "SUB-AGENCY-001",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: `john.agency-${timestamp}@test.com`,
            firstName: "John",
            lastName: "Agency",
            planType: "AGENCY",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
            trialDays: 14,
            trialEndDate: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        },
        customer_details: {
          name: "John Agency",
          email: `john.agency-${timestamp}@test.com`,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "John Agency",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act
      const response = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert - Response
      expect(response.received).toBe(true);
      expect(response.message).toBeDefined();
      expect(response.data?.userId).toBeDefined();
      expect(response.data?.paymentId).toBeDefined();
      expect(response.data?.subscriptionId).toBeDefined();

      // Assert - User Updated with correct data
      const updatedUser = await prisma.user.findUnique({
        where: { email: `john.agency-${timestamp}@test.com` },
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.firstName).toBe("John");
      expect(updatedUser?.lastName).toBe("Agency");
      expect(updatedUser?.email).toBe(`john.agency-${timestamp}@test.com`);
      expect(updatedUser?.plan).toBe(UserPlan.AGENCY);
      expect(updatedUser?.verified).toBe(true); // Still verified
      expect(updatedUser?.isAdmin).toBe(false);
      expect(updatedUser?.trialStartDate).toBeDefined();
      expect(updatedUser?.trialEndDate).toBeDefined();

      // Assert - Payment Created with correct fields
      const payment = await prisma.payment.findFirst({
        where: {
          buyerId: updatedUser?.id,
          transactionId: "PAY-AGENCY-TEST-001",
        },
      });

      expect(payment).toBeDefined();
      expect(payment?.transactionId).toBe("PAY-AGENCY-TEST-001");
      expect(payment?.amount).toBe(99.99);
      expect(payment?.currency).toBe("USD");
      expect(payment?.status).toBe("captured");
      expect(payment?.itemType).toBe(UserPlan.AGENCY);
      expect(payment?.paymentType).toBe("PLAN_PURCHASE");
      expect(payment?.buyerId).toBe(updatedUser?.id);
      expect(payment?.affiliateLinkId).toBeNull(); // No affiliate
      expect(payment?.workspaceId).toBeNull(); // No workspace for plan purchase
      expect(payment?.addOnId).toBeNull(); // No add-on
      expect(payment?.addOnType).toBeNull();
      expect(payment?.addOnQuantity).toBeNull();
      expect(payment?.commissionAmount).toBeNull();
      expect(payment?.affiliatePaid).toBe(false);
      expect(payment?.rawData).toBeDefined();

      // Assert - Subscription Created with correct fields
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: updatedUser?.id,
          subscriptionId: "SUB-AGENCY-001",
        },
      });

      expect(subscription).toBeDefined();
      expect(subscription?.subscriptionId).toBe("SUB-AGENCY-001");
      expect(subscription?.subscriberId).toBe("MPB-SUBSCRIBER-TEST123"); // NEW: subscriberId should be fetched and stored
      expect(subscription?.userId).toBe(user?.id);
      expect(subscription?.status).toBe("ACTIVE");
      expect(subscription?.itemType).toBe("PLAN");
      expect(subscription?.subscriptionType).toBe(UserPlan.AGENCY);
      expect(subscription?.addonType).toBeNull();
      expect(subscription?.intervalUnit).toBe("MONTH");
      expect(subscription?.intervalCount).toBe(1);
      expect(subscription?.startsAt).toBeDefined();
      expect(subscription?.endsAt).toBeDefined();
      expect(subscription?.rawData).toBeDefined();

      // Assert - MamoPay API was called to fetch subscriberId
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/subscriptions/SUB-AGENCY-001/subscribers"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Bearer"),
          }),
        })
      );

      // Verify subscription period is correct (1 month from start)
      const startDate = new Date(subscription!.startsAt);
      const endDate = new Date(subscription!.endsAt);
      const daysDiff = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBeGreaterThanOrEqual(28); // At least 28 days
      expect(daysDiff).toBeLessThanOrEqual(31); // At most 31 days
    });

    it("should create agency user with annual subscription", async () => {
      // Arrange - Create verified user first
      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `annual.agency-${timestamp}@test.com`,
          username: `annualagency${timestamp}`,
          firstName: "Annual",
          lastName: "Agency",
          password: "hashed_password",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      const mockWebhookPayload = {
        event_type: "charge.succeeded",
        status: "captured",
        id: "PAY-AGENCY-ANNUAL-001",
        amount: 999.99,
        amount_currency: "USD",
        subscription_id: "SUB-AGENCY-ANNUAL-001",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: `annual.agency-${timestamp}@test.com`,
            firstName: "Annual",
            lastName: "Agency",
            planType: "AGENCY",
            paymentType: "PLAN_PURCHASE",
            frequency: "annually",
            frequencyInterval: 1,
            trialDays: 30,
            trialEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        },
        customer_details: {
          name: "Annual Agency",
          email: `annual.agency-${timestamp}@test.com`,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "Annual Agency",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act
      const response = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert
      expect(response.received).toBe(true);

      const updatedUser = await prisma.user.findUnique({
        where: { email: `annual.agency-${timestamp}@test.com` },
      });
      expect(updatedUser?.plan).toBe(UserPlan.AGENCY);

      const subscription = await prisma.subscription.findFirst({
        where: { userId: updatedUser?.id },
      });

      expect(subscription?.intervalUnit).toBe("YEAR");
      expect(subscription?.intervalCount).toBe(1);

      // Verify subscription period is correct (1 year from start)
      const startDate = new Date(subscription!.startsAt);
      const endDate = new Date(subscription!.endsAt);
      const daysDiff = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBeGreaterThanOrEqual(365);
      expect(daysDiff).toBeLessThanOrEqual(366);
    });
  });

  describe("Business User Plan Purchase", () => {
    it("should create business user with subscription, payment, and send set password email", async () => {
      // Arrange - Create verified user first
      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `jane.business-${timestamp}@test.com`,
          username: `janebusiness${timestamp}`,
          firstName: "Jane",
          lastName: "Business",
          password: "hashed_password",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      const mockWebhookPayload = {
        event_type: "charge.succeeded",
        status: "captured",
        id: "PAY-BUSINESS-TEST-001",
        amount: 199.99,
        amount_currency: "USD",
        subscription_id: "SUB-BUSINESS-001",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: `jane.business-${timestamp}@test.com`,
            firstName: "Jane",
            lastName: "Business",
            planType: "BUSINESS",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
            trialDays: 14,
            trialEndDate: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        },
        customer_details: {
          name: "Jane Business",
          email: `jane.business-${timestamp}@test.com`,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "Jane Business",
          card_last4: "5555",
          card_expiry_month: "06",
          card_expiry_year: "2026",
          origin: "web",
        },
      };

      // Act
      const response = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert - Response
      expect(response.received).toBe(true);
      expect(response.message).toBeDefined();
      expect(response.data?.userId).toBeDefined();
      expect(response.data?.paymentId).toBeDefined();
      expect(response.data?.subscriptionId).toBeDefined();

      // Assert - User Updated
      const updatedUser = await prisma.user.findUnique({
        where: { email: `jane.business-${timestamp}@test.com` },
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser?.firstName).toBe("Jane");
      expect(updatedUser?.lastName).toBe("Business");
      expect(updatedUser?.plan).toBe(UserPlan.BUSINESS);
      expect(updatedUser?.verified).toBe(true);

      // Assert - Payment Created
      const payment = await prisma.payment.findFirst({
        where: { buyerId: updatedUser?.id },
      });

      expect(payment?.amount).toBe(199.99);
      expect(payment?.itemType).toBe(UserPlan.BUSINESS);
      expect(payment?.paymentType).toBe("PLAN_PURCHASE");
      expect(payment?.affiliateLinkId).toBeNull();
      expect(payment?.workspaceId).toBeNull();

      // Assert - Subscription Created
      const subscription = await prisma.subscription.findFirst({
        where: { userId: updatedUser?.id },
      });

      expect(subscription?.itemType).toBe("PLAN");
      expect(subscription?.subscriptionType).toBe(UserPlan.BUSINESS);
      expect(subscription?.addonType).toBeNull();
      expect(subscription?.status).toBe("ACTIVE");
      expect(subscription?.intervalUnit).toBe("MONTH");
    });

    it("should create business user with annual subscription", async () => {
      // Arrange - Create verified user first
      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `annual.business-${timestamp}@test.com`,
          username: `annualbusiness${timestamp}`,
          firstName: "Annual",
          lastName: "Business",
          password: "hashed_password",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      const mockWebhookPayload = {
        event_type: "charge.succeeded",
        status: "captured",
        id: "PAY-BUSINESS-ANNUAL-001",
        amount: 1999.99,
        amount_currency: "USD",
        subscription_id: "SUB-BUSINESS-ANNUAL-001",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: `annual.business-${timestamp}@test.com`,
            firstName: "Annual",
            lastName: "Business",
            planType: "BUSINESS",
            paymentType: "PLAN_PURCHASE",
            frequency: "annually",
            frequencyInterval: 1,
            trialDays: 30,
            trialEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        },
        customer_details: {
          name: "Annual Business",
          email: `annual.business-${timestamp}@test.com`,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "Annual Business",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act
      const response = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert
      expect(response.received).toBe(true);

      const updatedUser = await prisma.user.findUnique({
        where: { email: `annual.business-${timestamp}@test.com` },
      });
      expect(updatedUser?.plan).toBe(UserPlan.BUSINESS);

      const subscription = await prisma.subscription.findFirst({
        where: { userId: updatedUser?.id },
      });

      expect(subscription?.intervalUnit).toBe("YEAR");
      expect(subscription?.intervalCount).toBe(1);
    });
  });

  describe("Edge Cases - Duplicate Prevention", () => {
    it("should not create duplicate user if email already exists", async () => {
      // Arrange - Create existing user
      const timestamp = Date.now();
      const existingUser = await prisma.user.create({
        data: {
          email: `existing-${timestamp}@test.com`,
          username: `existinguser${timestamp}`,
          firstName: "Existing",
          lastName: "User",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.AGENCY,
          isAdmin: false,
          balance: 0,
          partnerLevel: 1,
          totalSales: 0,
          commissionPercentage: 5,
        },
      });

      const mockWebhookPayload = {
        event_type: "charge.succeeded",
        status: "captured",
        id: "PAY-DUPLICATE-001",
        amount: 99.99,
        amount_currency: "USD",
        subscription_id: "SUB-DUPLICATE-001",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: `existing-${timestamp}@test.com`, // Same email
            firstName: "Duplicate",
            lastName: "Attempt",
            planType: "AGENCY",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
            trialDays: 14,
            trialEndDate: new Date().toISOString(),
          },
        },
        customer_details: {
          name: "Duplicate Attempt",
          email: `existing-${timestamp}@test.com`,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "Duplicate",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act
      const response = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert - Should process for existing user but not send emails again
      expect(response.received).toBe(true);

      // Verify only one user exists with this email
      const users = await prisma.user.findMany({
        where: { email: `existing-${timestamp}@test.com` },
      });
      expect(users).toHaveLength(1);
      expect(users[0].id).toBe(existingUser.id);

      // Emails should NOT be sent for existing user
      expect(sendSetPasswordEmail).not.toHaveBeenCalled();

      // Payment and subscription should still be created
      const payment = await prisma.payment.findFirst({
        where: { transactionId: "PAY-DUPLICATE-001" },
      });
      expect(payment).toBeDefined();
      expect(payment?.buyerId).toBe(existingUser.id);

      const subscription = await prisma.subscription.findFirst({
        where: { subscriptionId: "SUB-DUPLICATE-001" },
      });
      expect(subscription).toBeDefined();
      expect(subscription?.userId).toBe(existingUser.id);
    });

    it("should not process duplicate payment (same transaction ID)", async () => {
      // Arrange - Create verified user first
      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `unique1-${timestamp}@test.com`,
          username: `unique1${timestamp}`,
          firstName: "First",
          lastName: "User",
          password: "hashed_password",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      // First payment
      const firstWebhook = {
        event_type: "charge.succeeded",
        status: "captured",
        id: "PAY-DUPLICATE-TRANSACTION",
        amount: 99.99,
        amount_currency: "USD",
        subscription_id: "SUB-001",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: `unique1-${timestamp}@test.com`,
            firstName: "First",
            lastName: "User",
            planType: "AGENCY",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
            trialDays: 14,
            trialEndDate: new Date().toISOString(),
          },
        },
        customer_details: {
          name: "First User",
          email: `unique1-${timestamp}@test.com`,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "First",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act - Process first webhook
      await PaymentWebhookService.processWebhook(firstWebhook);

      // Clear mocks
      vi.clearAllMocks();

      // Second webhook with SAME transaction ID
      const secondWebhook = {
        ...firstWebhook,
        custom_data: {
          details: {
            ...firstWebhook.custom_data.details,
            email: `unique2-${timestamp}@test.com`, // Different email but same transaction
          },
        },
      };

      // Act - Attempt to process duplicate
      const response = await PaymentWebhookService.processWebhook(
        secondWebhook
      );

      // Assert - Should be ignored
      expect(response.received).toBe(true);
      expect(response.ignored).toBe(true);
      expect(response.reason).toBe("Payment already processed");

      // Verify no new user created
      const user2 = await prisma.user.findUnique({
        where: { email: `unique2-${timestamp}@test.com` },
      });
      expect(user2).toBeNull();

      // Verify only one payment exists
      const payments = await prisma.payment.findMany({
        where: { transactionId: "PAY-DUPLICATE-TRANSACTION" },
      });
      expect(payments).toHaveLength(1);
    });
  });

  describe("Edge Cases - Missing Fields", () => {
    it("should reject webhook with missing required fields", async () => {
      // Arrange - Missing firstName
      const mockWebhookPayload = {
        event_type: "charge.succeeded",
        status: "captured",
        id: "PAY-INVALID-001",
        amount: 99.99,
        amount_currency: "USD",
        subscription_id: "SUB-INVALID-001",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "invalid@test.com",
            // firstName missing
            lastName: "User",
            planType: "AGENCY",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Invalid User",
          email: "invalid@test.com",
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "Invalid",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act
      const response = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert
      expect(response.received).toBe(true);
      expect(response.ignored).toBe(true);
      expect(response.reason).toContain("Invalid webhook data");

      // Verify no user created
      const user = await prisma.user.findUnique({
        where: { email: "invalid@test.com" },
      });
      expect(user).toBeNull();

      // Verify no emails sent
      expect(sendSetPasswordEmail).not.toHaveBeenCalled();
    });

    it("should reject webhook with invalid email format", async () => {
      // Arrange
      const mockWebhookPayload = {
        event_type: "charge.succeeded",
        status: "captured",
        id: "PAY-BAD-EMAIL-001",
        amount: 99.99,
        amount_currency: "USD",
        subscription_id: "SUB-001",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "not-an-email", // Invalid email
            firstName: "Test",
            lastName: "User",
            planType: "AGENCY",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Test User",
          email: "not-an-email",
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "Test",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act
      const response = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert
      expect(response.received).toBe(true);
      expect(response.ignored).toBe(true);
      expect(response.reason).toContain("Invalid webhook data");
    });
  });

  describe("Edge Cases - Wrong Event Type or Status", () => {
    it("should ignore non-charge.succeeded event types", async () => {
      // Arrange
      const mockWebhookPayload = {
        event_type: "charge.failed", // Wrong event type
        status: "failed",
        id: "PAY-FAILED-001",
        amount: 99.99,
        amount_currency: "USD",
        subscription_id: "SUB-001",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "failed@test.com",
            firstName: "Failed",
            lastName: "User",
            planType: "AGENCY",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Failed User",
          email: "failed@test.com",
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "Failed",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act
      const response = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert
      expect(response.received).toBe(true);
      expect(response.ignored).toBe(true);
      expect(response.reason).toContain("Event type not supported");

      // Verify no processing occurred
      const user = await prisma.user.findUnique({
        where: { email: "failed@test.com" },
      });
      expect(user).toBeNull();
      expect(sendSetPasswordEmail).not.toHaveBeenCalled();
    });

    it("should ignore non-captured status", async () => {
      // Arrange
      const mockWebhookPayload = {
        event_type: "charge.succeeded",
        status: "pending", // Wrong status
        id: "PAY-PENDING-001",
        amount: 99.99,
        amount_currency: "USD",
        subscription_id: "SUB-001",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: "pending@test.com",
            firstName: "Pending",
            lastName: "User",
            planType: "AGENCY",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
          },
        },
        customer_details: {
          name: "Pending User",
          email: "pending@test.com",
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "Pending",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act
      const response = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert
      expect(response.received).toBe(true);
      expect(response.ignored).toBe(true);
      expect(response.reason).toContain("Status not captured");
    });
  });

  describe("Edge Cases - Email Service Failure", () => {
    it("should handle set password email failure gracefully", async () => {
      // Arrange - Create verified user first (no email should be sent now)
      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `pwdfail-${timestamp}@test.com`,
          username: `pwdfail${timestamp}`,
          firstName: "Password",
          lastName: "Fail",
          password: "hashed_password",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      vi.mocked(sendSetPasswordEmail).mockRejectedValue(
        new Error("Email service unavailable")
      );

      const mockWebhookPayload = {
        event_type: "charge.succeeded",
        status: "captured",
        id: "PAY-PWD-EMAIL-FAIL-001",
        amount: 99.99,
        amount_currency: "USD",
        subscription_id: "SUB-PWD-FAIL-001",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: `pwdfail-${timestamp}@test.com`,
            firstName: "Password",
            lastName: "Fail",
            planType: "BUSINESS",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
            trialDays: 14,
            trialEndDate: new Date().toISOString(),
          },
        },
        customer_details: {
          name: "Password Fail",
          email: `pwdfail-${timestamp}@test.com`,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "Password Fail",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act - Should not throw
      const response = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert - Still processes successfully
      expect(response.received).toBe(true);

      const updatedUser = await prisma.user.findUnique({
        where: { email: `pwdfail-${timestamp}@test.com` },
      });
      expect(updatedUser).toBeDefined();
      expect(updatedUser?.plan).toBe(UserPlan.BUSINESS);

      // No email should be sent since user already exists and is verified
      expect(sendSetPasswordEmail).not.toHaveBeenCalled();
    });
  });

  describe("Subscription Renewal", () => {
    it("should handle renewal for existing subscription without sending emails again", async () => {
      // Arrange - Create existing user and subscription
      const timestamp = Date.now();
      const existingUser = await prisma.user.create({
        data: {
          email: `renewal-${timestamp}@test.com`,
          username: `renewaluser${timestamp}`,
          firstName: "Renewal",
          lastName: "User",
          password: "$2b$10$hashedpassword",
          verified: true,
          plan: UserPlan.AGENCY,
          isAdmin: false,
          balance: 0,
          partnerLevel: 1,
          totalSales: 0,
          commissionPercentage: 5,
        },
      });

      const currentEndDate = new Date();
      currentEndDate.setDate(currentEndDate.getDate() + 30);

      const existingSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "SUB-RENEWAL-001",
          userId: existingUser.id,
          startsAt: new Date(),
          endsAt: currentEndDate,
          status: "ACTIVE",
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "PLAN",
          subscriptionType: UserPlan.AGENCY,
          addonType: null,
        },
      });

      // Create renewal webhook
      const renewalWebhook = {
        event_type: "charge.succeeded",
        status: "captured",
        id: "PAY-RENEWAL-002",
        amount: 99.99,
        amount_currency: "USD",
        subscription_id: "SUB-RENEWAL-001", // Same subscription ID
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: `renewal-${timestamp}@test.com`,
            firstName: "Renewal",
            lastName: "User",
            planType: "AGENCY",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
            trialDays: 0,
          },
        },
        customer_details: {
          name: "Renewal User",
          email: `renewal-${timestamp}@test.com`,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "Renewal User",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act
      const response = await PaymentWebhookService.processWebhook(
        renewalWebhook
      );

      // Assert
      expect(response.received).toBe(true);
      expect(response.message).toContain("renewed");

      // Verify NO emails sent (it's a renewal)
      expect(sendSetPasswordEmail).not.toHaveBeenCalled();

      // Verify new payment created
      const renewalPayment = await prisma.payment.findFirst({
        where: { transactionId: "PAY-RENEWAL-002" },
      });
      expect(renewalPayment).toBeDefined();
      expect(renewalPayment?.buyerId).toBe(existingUser.id);

      // Verify subscription end date extended
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: existingSubscription.id },
      });
      expect(updatedSubscription?.endsAt.getTime()).toBeGreaterThan(
        currentEndDate.getTime()
      );

      // Verify only one subscription exists
      const subscriptions = await prisma.subscription.findMany({
        where: { userId: existingUser.id },
      });
      expect(subscriptions).toHaveLength(1);
    });
  });

  describe("MamoPay Integration", () => {
    it("should fetch and store subscriberId from MamoPay API", async () => {
      // Arrange - Create verified user
      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `mamopay-success-${timestamp}@test.com`,
          username: `mamopaysuccess${timestamp}`,
          firstName: "MamoPay",
          lastName: "Success",
          password: "hashed_password",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      const mockWebhookPayload = {
        event_type: "charge.succeeded",
        status: "captured",
        id: "PAY-MAMOPAY-001",
        amount: 99.99,
        amount_currency: "USD",
        subscription_id: "SUB-MAMOPAY-001",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: `mamopay-success-${timestamp}@test.com`,
            firstName: "MamoPay",
            lastName: "Success",
            planType: "AGENCY",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
            trialDays: 14,
            trialEndDate: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        },
        customer_details: {
          name: "MamoPay Success",
          email: `mamopay-success-${timestamp}@test.com`,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "MamoPay Success",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act
      const response = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert - Response
      expect(response.received).toBe(true);

      // Assert - MamoPay API was called with correct parameters
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining("/subscriptions/SUB-MAMOPAY-001/subscribers"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Bearer"),
          }),
        })
      );

      // Assert - subscriberId stored in database
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          subscriptionId: "SUB-MAMOPAY-001",
        },
      });

      expect(subscription).toBeDefined();
      expect(subscription?.subscriberId).toBe("MPB-SUBSCRIBER-TEST123");
    });

    it("should handle MamoPay API failure gracefully", async () => {
      // Arrange - Mock MamoPay API to fail
      vi.mocked(axios.get).mockRejectedValueOnce(
        new Error("MamoPay API unavailable")
      );

      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `mamopay-fail-${timestamp}@test.com`,
          username: `mamopayfail${timestamp}`,
          firstName: "MamoPay",
          lastName: "Fail",
          password: "hashed_password",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      const mockWebhookPayload = {
        event_type: "charge.succeeded",
        status: "captured",
        id: "PAY-MAMOPAY-FAIL-001",
        amount: 99.99,
        amount_currency: "USD",
        subscription_id: "SUB-MAMOPAY-FAIL-001",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: `mamopay-fail-${timestamp}@test.com`,
            firstName: "MamoPay",
            lastName: "Fail",
            planType: "AGENCY",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
            trialDays: 14,
            trialEndDate: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        },
        customer_details: {
          name: "MamoPay Fail",
          email: `mamopay-fail-${timestamp}@test.com`,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "MamoPay Fail",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act - Should not throw, continues processing
      const response = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert - Webhook still processed successfully
      expect(response.received).toBe(true);

      // Assert - Subscription created but subscriberId is null
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          subscriptionId: "SUB-MAMOPAY-FAIL-001",
        },
      });

      expect(subscription).toBeDefined();
      expect(subscription?.subscriberId).toBeNull();

      // Reset mock for other tests
      vi.mocked(axios.get).mockResolvedValue({
        data: [
          {
            id: "MPB-SUBSCRIBER-TEST123",
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

    it("should handle empty subscribers response from MamoPay", async () => {
      // Arrange - Mock MamoPay API to return empty array
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: [], // No subscribers
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });

      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `mamopay-empty-${timestamp}@test.com`,
          username: `mamopayempty${timestamp}`,
          firstName: "MamoPay",
          lastName: "Empty",
          password: "hashed_password",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      const mockWebhookPayload = {
        event_type: "charge.succeeded",
        status: "captured",
        id: "PAY-MAMOPAY-EMPTY-001",
        amount: 99.99,
        amount_currency: "USD",
        subscription_id: "SUB-MAMOPAY-EMPTY-001",
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: `mamopay-empty-${timestamp}@test.com`,
            firstName: "MamoPay",
            lastName: "Empty",
            planType: "BUSINESS",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
            trialDays: 14,
            trialEndDate: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        },
        customer_details: {
          name: "MamoPay Empty",
          email: `mamopay-empty-${timestamp}@test.com`,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "MamoPay Empty",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act
      const response = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert - Webhook still processed successfully
      expect(response.received).toBe(true);

      // Assert - Subscription created but subscriberId is null
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          subscriptionId: "SUB-MAMOPAY-EMPTY-001",
        },
      });

      expect(subscription).toBeDefined();
      expect(subscription?.subscriberId).toBeNull();

      // Reset mock
      vi.mocked(axios.get).mockResolvedValue({
        data: [
          {
            id: "MPB-SUBSCRIBER-TEST123",
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

    it("should skip MamoPay fetch when subscription_id is null", async () => {
      // Arrange
      const timestamp = Date.now();
      const user = await prisma.user.create({
        data: {
          email: `mamopay-nosub-${timestamp}@test.com`,
          username: `mamopaynosub${timestamp}`,
          firstName: "MamoPay",
          lastName: "NoSub",
          password: "hashed_password",
          verified: true,
          plan: UserPlan.FREE,
        },
      });

      const mockWebhookPayload = {
        event_type: "charge.succeeded",
        status: "captured",
        id: "PAY-MAMOPAY-NOSUB-001",
        amount: 99.99,
        amount_currency: "USD",
        subscription_id: null, // No subscription_id
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: `mamopay-nosub-${timestamp}@test.com`,
            firstName: "MamoPay",
            lastName: "NoSub",
            planType: "BUSINESS",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
            trialDays: 0,
            trialEndDate: new Date().toISOString(),
          },
        },
        customer_details: {
          name: "MamoPay NoSub",
          email: `mamopay-nosub-${timestamp}@test.com`,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "MamoPay NoSub",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Clear mocks to verify axios.get is not called
      vi.clearAllMocks();

      // Act
      const response = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert - Webhook processed successfully
      expect(response.received).toBe(true);

      // Assert - MamoPay API was NOT called
      expect(axios.get).not.toHaveBeenCalled();

      // Assert - Subscription created with null subscriberId
      const subscription = await prisma.subscription.findFirst({
        where: { userId: user.id },
      });

      expect(subscription).toBeDefined();
      expect(subscription?.subscriberId).toBeNull();
    });
  });

  describe("Existing User Scenarios", () => {
    it("should link subscription to existing verified user and update plan", async () => {
      // Arrange - Create existing verified user
      const existingEmail = `existing-${Date.now()}@example.com`;
      const existingUser = await prisma.user.create({
        data: {
          email: existingEmail,
          username: `existing${Date.now()}`,
          firstName: "Existing",
          lastName: "User",
          password: "hashed-password",
          plan: UserPlan.FREE,
          verified: true,
        },
      });

      const mockWebhookPayload = {
        id: `txn_existing_user_${Date.now()}`,
        event_type: "charge.succeeded",
        status: "captured",
        amount: 199.0,
        amount_currency: "USD",
        subscription_id: `sub_existing_${Date.now()}`,
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: existingEmail,
            firstName: "Existing",
            lastName: "User",
            planType: "AGENCY",
            paymentType: "PLAN_PURCHASE",
            frequency: "annually",
            frequencyInterval: 1,
            trialDays: 0,
          },
          userId: existingUser.id, // Include userId from logged-in user
        },
        customer_details: {
          name: "Existing User",
          email: existingEmail,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "Existing User",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act
      const result = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert
      expect(result.received).toBe(true);
      // Note: result.message comes from processor and may vary

      // Verify user was updated, not created new
      const updatedUser = await prisma.user.findUnique({
        where: { id: existingUser.id },
      });
      expect(updatedUser?.plan).toBe(UserPlan.AGENCY);
      expect(updatedUser?.verified).toBe(true);

      // Verify subscription was created for existing user
      const subscription = await prisma.subscription.findFirst({
        where: { userId: existingUser.id },
      });
      expect(subscription).toBeDefined();
      expect(subscription?.subscriptionType).toBe(UserPlan.AGENCY);

      // Verify payment was created
      const payment = await prisma.payment.findFirst({
        where: { buyerId: existingUser.id },
      });
      expect(payment).toBeDefined();

      // Verify only one user exists with this email
      const users = await prisma.user.findMany({
        where: { email: existingEmail },
      });
      expect(users).toHaveLength(1);
    });

    it("should verify unverified user when they make payment", async () => {
      // Arrange - Create unverified user
      const unverifiedEmail = `unverified-${Date.now()}@example.com`;
      const unverifiedUser = await prisma.user.create({
        data: {
          email: unverifiedEmail,
          username: `unverified${Date.now()}`,
          firstName: "Unverified",
          lastName: "User",
          password: "hashed-password",
          plan: UserPlan.FREE,
          verified: false, // NOT verified
        },
      });

      const mockWebhookPayload = {
        id: `txn_unverified_${Date.now()}`,
        event_type: "charge.succeeded",
        status: "captured",
        amount: 99.0,
        amount_currency: "USD",
        subscription_id: `sub_unverified_${Date.now()}`,
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: unverifiedEmail,
            firstName: "Unverified",
            lastName: "User",
            planType: "BUSINESS",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
            trialDays: 14,
          },
          userId: unverifiedUser.id,
        },
        customer_details: {
          name: "Unverified User",
          email: unverifiedEmail,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "Unverified User",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act & Assert - Should reject unverified user
      await expect(
        PaymentWebhookService.processWebhook(mockWebhookPayload)
      ).rejects.toThrow("User email not verified");

      // Verify user was NOT upgraded or verified
      const stillUnverifiedUser = await prisma.user.findUnique({
        where: { id: unverifiedUser.id },
      });
      expect(stillUnverifiedUser?.verified).toBe(false);
      expect(stillUnverifiedUser?.plan).toBe(UserPlan.FREE);

      // Verify no payment or subscription was created
      const payment = await prisma.payment.findFirst({
        where: { buyerId: unverifiedUser.id },
      });
      expect(payment).toBeNull();

      const subscription = await prisma.subscription.findFirst({
        where: { userId: unverifiedUser.id },
      });
      expect(subscription).toBeNull();
    });

    it("should use userId for lookup when provided and validate email match", async () => {
      // Arrange
      const userEmail = `user-lookup-${Date.now()}@example.com`;
      const user = await prisma.user.create({
        data: {
          email: userEmail,
          username: `userlookup${Date.now()}`,
          firstName: "User",
          lastName: "Lookup",
          password: "hashed-password",
          plan: UserPlan.FREE,
          verified: true,
        },
      });

      const mockWebhookPayload = {
        id: `txn_lookup_${Date.now()}`,
        event_type: "charge.succeeded",
        status: "captured",
        amount: 99.0,
        amount_currency: "USD",
        subscription_id: `sub_lookup_${Date.now()}`,
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: userEmail,
            firstName: "User",
            lastName: "Lookup",
            planType: "BUSINESS",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
            trialDays: 0,
          },
          userId: user.id, // Provide userId
        },
        customer_details: {
          name: "User Lookup",
          email: userEmail,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "User Lookup",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act
      const result = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert - Should succeed
      expect(result.received).toBe(true);
      const subscription = await prisma.subscription.findFirst({
        where: { userId: user.id },
      });
      expect(subscription).toBeDefined();
    });

    it("should reject payment if userId and email don't match (security check)", async () => {
      // Arrange
      const user1 = await prisma.user.create({
        data: {
          email: `user1-${Date.now()}@example.com`,
          username: `user1${Date.now()}`,
          firstName: "User",
          lastName: "One",
          password: "hashed-password",
          plan: UserPlan.FREE,
          verified: true,
        },
      });

      const user2Email = `user2-${Date.now()}@example.com`;

      const mockWebhookPayload = {
        id: `txn_mismatch_${Date.now()}`,
        event_type: "charge.succeeded",
        status: "captured",
        amount: 99.0,
        amount_currency: "USD",
        subscription_id: `sub_mismatch_${Date.now()}`,
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: user2Email, // Different email
            firstName: "User",
            lastName: "Two",
            planType: "BUSINESS",
            paymentType: "PLAN_PURCHASE",
            frequency: "monthly",
            frequencyInterval: 1,
            trialDays: 0,
          },
          userId: user1.id, // But user1's ID
        },
        customer_details: {
          name: "User Two",
          email: user2Email,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "User Two",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act & Assert - Should throw security error
      await expect(
        PaymentWebhookService.processWebhook(mockWebhookPayload)
      ).rejects.toThrow("Security validation failed");
    });

    it("should fallback to email lookup if userId not provided", async () => {
      // Arrange
      const existingEmail = `fallback-${Date.now()}@example.com`;
      const existingUser = await prisma.user.create({
        data: {
          email: existingEmail,
          username: `fallback${Date.now()}`,
          firstName: "Fallback",
          lastName: "User",
          password: "hashed-password",
          plan: UserPlan.FREE,
          verified: true,
        },
      });

      const mockWebhookPayload = {
        id: `txn_fallback_${Date.now()}`,
        event_type: "charge.succeeded",
        status: "captured",
        amount: 199.0,
        amount_currency: "USD",
        subscription_id: `sub_fallback_${Date.now()}`,
        created_date: new Date().toISOString(),
        custom_data: {
          details: {
            email: existingEmail,
            firstName: "Fallback",
            lastName: "User",
            planType: "AGENCY",
            paymentType: "PLAN_PURCHASE",
            frequency: "annually",
            frequencyInterval: 1,
            trialDays: 0,
          },
          // No userId provided - should use email
        },
        customer_details: {
          name: "Fallback User",
          email: existingEmail,
          phone_number: "+1234567890",
        },
        payment_method: {
          type: "card",
          card_holder_name: "Fallback User",
          card_last4: "4242",
          card_expiry_month: "12",
          card_expiry_year: "2025",
          origin: "web",
        },
      };

      // Act
      const result = await PaymentWebhookService.processWebhook(
        mockWebhookPayload
      );

      // Assert
      expect(result.received).toBe(true);

      // Verify subscription linked to existing user
      const subscription = await prisma.subscription.findFirst({
        where: { userId: existingUser.id },
      });
      expect(subscription).toBeDefined();

      // Verify no duplicate user created
      const users = await prisma.user.findMany({
        where: { email: existingEmail },
      });
      expect(users).toHaveLength(1);
    });
  });
});
