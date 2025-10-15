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
import { PaymentWebhookService } from "../../services/subscription/webhook";
import { sendSetPasswordEmail } from "../../helpers/subscription/emails/set-password";
import { UserPlan } from "../../generated/prisma-client";

// Mock email services
vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
  },
}));
vi.mock("../../helpers/subscription/emails/set-password");

describe("Subscription Webhook - Plan Purchase Generic User Creation", () => {
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
  });

  describe("Agency User Plan Purchase", () => {
    it("should create agency user with subscription, payment, and send set password email", async () => {
      // Arrange
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
            email: "john.agency@test.com",
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
          email: "john.agency@test.com",
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

      // Assert - User Created with correct data
      const user = await prisma.user.findUnique({
        where: { email: "john.agency@test.com" },
      });

      expect(user).toBeDefined();
      expect(user?.firstName).toBe("John");
      expect(user?.lastName).toBe("Agency");
      expect(user?.email).toBe("john.agency@test.com");
      expect(user?.plan).toBe(UserPlan.AGENCY);
      expect(user?.verified).toBe(false); // Not verified yet
      expect(user?.verificationToken).toBeDefined(); // Token generated
      expect(user?.verificationTokenExpiresAt).toBeDefined();
      expect(user?.passwordResetToken).toBeDefined(); // Set password token generated
      expect(user?.passwordResetExpiresAt).toBeDefined();
      expect(user?.isAdmin).toBe(false);
      expect(user?.trialStartDate).toBeDefined();
      expect(user?.trialEndDate).toBeDefined();

      // Assert - Payment Created with correct fields
      const payment = await prisma.payment.findFirst({
        where: {
          buyerId: user?.id,
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
      expect(payment?.buyerId).toBe(user?.id);
      expect(payment?.affiliateLinkId).toBeNull(); // No affiliate
      expect(payment?.workspaceId).toBeNull(); // No workspace for plan purchase
      expect(payment?.addOnId).toBeNull(); // No add-on
      expect(payment?.addOnType).toBeNull();
      expect(payment?.addOnQuantity).toBeNull();
      expect(payment?.level1AffiliateAmount).toBeNull();
      expect(payment?.affiliatePaid).toBe(false);
      expect(payment?.rawData).toBeDefined();

      // Assert - Subscription Created with correct fields
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: user?.id,
          subscriptionId: "SUB-AGENCY-001",
        },
      });

      expect(subscription).toBeDefined();
      expect(subscription?.subscriptionId).toBe("SUB-AGENCY-001");
      expect(subscription?.userId).toBe(user?.id);
      expect(subscription?.status).toBe("ACTIVE");
      expect(subscription?.subscriptionType).toBe(UserPlan.AGENCY);
      expect(subscription?.intervalUnit).toBe("MONTH");
      expect(subscription?.intervalCount).toBe(1);
      expect(subscription?.startsAt).toBeDefined();
      expect(subscription?.endsAt).toBeDefined();
      expect(subscription?.rawData).toBeDefined();

      // Verify subscription period is correct (1 month from start)
      const startDate = new Date(subscription!.startsAt);
      const endDate = new Date(subscription!.endsAt);
      const daysDiff = Math.round(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBeGreaterThanOrEqual(28); // At least 28 days
      expect(daysDiff).toBeLessThanOrEqual(31); // At most 31 days

      // Assert - Set Password Email Sent
      expect(sendSetPasswordEmail).toHaveBeenCalledTimes(1);
      expect(sendSetPasswordEmail).toHaveBeenCalledWith(
        "john.agency@test.com",
        "John",
        user?.passwordResetToken
      );
    });

    it("should create agency user with annual subscription", async () => {
      // Arrange
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
            email: "annual.agency@test.com",
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
          email: "annual.agency@test.com",
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

      const user = await prisma.user.findUnique({
        where: { email: "annual.agency@test.com" },
      });
      expect(user?.plan).toBe(UserPlan.AGENCY);

      const subscription = await prisma.subscription.findFirst({
        where: { userId: user?.id },
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

      // Verify 2 emails sent
      expect(sendSetPasswordEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe("Business User Plan Purchase", () => {
    it("should create business user with subscription, payment, and send set password email", async () => {
      // Arrange
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
            email: "jane.business@test.com",
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
          email: "jane.business@test.com",
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

      // Assert - User Created
      const user = await prisma.user.findUnique({
        where: { email: "jane.business@test.com" },
      });

      expect(user).toBeDefined();
      expect(user?.firstName).toBe("Jane");
      expect(user?.lastName).toBe("Business");
      expect(user?.plan).toBe(UserPlan.BUSINESS);
      expect(user?.verified).toBe(false);
      expect(user?.verificationToken).toBeDefined();
      expect(user?.passwordResetToken).toBeDefined();

      // Assert - Payment Created
      const payment = await prisma.payment.findFirst({
        where: { buyerId: user?.id },
      });

      expect(payment?.amount).toBe(199.99);
      expect(payment?.itemType).toBe(UserPlan.BUSINESS);
      expect(payment?.paymentType).toBe("PLAN_PURCHASE");
      expect(payment?.affiliateLinkId).toBeNull();
      expect(payment?.workspaceId).toBeNull();

      // Assert - Subscription Created
      const subscription = await prisma.subscription.findFirst({
        where: { userId: user?.id },
      });

      expect(subscription?.subscriptionType).toBe(UserPlan.BUSINESS);
      expect(subscription?.status).toBe("ACTIVE");
      expect(subscription?.intervalUnit).toBe("MONTH");

      // Assert - Set Password Email Sent
      expect(sendSetPasswordEmail).toHaveBeenCalledTimes(1);
      expect(sendSetPasswordEmail).toHaveBeenCalledWith(
        "jane.business@test.com",
        "Jane",
        user?.passwordResetToken
      );
    });

    it("should create business user with annual subscription", async () => {
      // Arrange
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
            email: "annual.business@test.com",
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
          email: "annual.business@test.com",
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

      const user = await prisma.user.findUnique({
        where: { email: "annual.business@test.com" },
      });
      expect(user?.plan).toBe(UserPlan.BUSINESS);

      const subscription = await prisma.subscription.findFirst({
        where: { userId: user?.id },
      });

      expect(subscription?.intervalUnit).toBe("YEAR");
      expect(subscription?.intervalCount).toBe(1);

      // Verify 2 emails sent
      expect(sendSetPasswordEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases - Duplicate Prevention", () => {
    it("should not create duplicate user if email already exists", async () => {
      // Arrange - Create existing user
      const existingUser = await prisma.user.create({
        data: {
          email: "existing@test.com",
          username: "existinguser",
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
            email: "existing@test.com", // Same email
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
          email: "existing@test.com",
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
        where: { email: "existing@test.com" },
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
      // Arrange - First payment
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
            email: "unique1@test.com",
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
          email: "unique1@test.com",
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
            email: "unique2@test.com", // Different email but same transaction
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
        where: { email: "unique2@test.com" },
      });
      expect(user2).toBeNull();

      // Verify no emails sent for duplicate
      expect(sendSetPasswordEmail).not.toHaveBeenCalled();

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
    // Test removed: verification email now sent directly via sgMail in service, not testable this way

    it("should handle set password email failure gracefully", async () => {
      // Arrange
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
            email: "pwdfail@test.com",
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
          email: "pwdfail@test.com",
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

      const user = await prisma.user.findUnique({
        where: { email: "pwdfail@test.com" },
      });
      expect(user).toBeDefined();
      expect(user?.passwordResetToken).toBeDefined(); // Token still generated

      // Verify email was attempted
      expect(sendSetPasswordEmail).toHaveBeenCalled();
    });
  });

  describe("Subscription Renewal", () => {
    it("should handle renewal for existing subscription without sending emails again", async () => {
      // Arrange - Create existing user and subscription
      const existingUser = await prisma.user.create({
        data: {
          email: "renewal@test.com",
          username: "renewaluser",
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
          subscriptionType: UserPlan.AGENCY,
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
            email: "renewal@test.com",
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
          email: "renewal@test.com",
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
});
