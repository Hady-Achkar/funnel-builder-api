import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  vi,
} from "vitest";
import { setPrismaClient } from "../../lib/prisma";
import { PrismaClient } from "../../generated/prisma-client";
import { UserPlan, AddOnType } from "../../generated/prisma-client";
import { CancelSubscriptionService } from "../../services/subscription/cancel";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../errors";

let prisma: PrismaClient;

// Mock console.log to avoid cluttering test output
vi.spyOn(console, "log").mockImplementation(() => {});

describe("Cancel Subscription Service", () => {
  let userId: number;
  let otherUserId: number;
  let planSubscriptionId: string;
  let addonSubscriptionId: string;

  beforeAll(async () => {
    // Setup Prisma for tests
    prisma = new PrismaClient();
    setPrismaClient(prisma);

    // Create a verified user
    const user = await prisma.user.create({
      data: {
        email: "cancel-test@example.com",
        username: "canceltest",
        firstName: "Cancel",
        lastName: "Test",
        password: "hashedpassword",
        verified: true,
        plan: UserPlan.BUSINESS,
        trialStartDate: new Date(),
        trialEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });

    userId = user.id;

    // Create another user for ownership tests
    const otherUser = await prisma.user.create({
      data: {
        email: "other@example.com",
        username: "otheruser",
        firstName: "Other",
        lastName: "User",
        password: "hashedpassword",
        verified: true,
        plan: UserPlan.BUSINESS,
      },
    });

    otherUserId = otherUser.id;

    // Create a plan subscription
    const planSubscription = await prisma.subscription.create({
      data: {
        subscriptionId: "SUB-PLAN-123",
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        status: "ACTIVE",
        userId: user.id,
        intervalUnit: "YEAR",
        intervalCount: 1,
        itemType: "PLAN",
        subscriptionType: UserPlan.BUSINESS,
        rawData: {},
      },
    });

    planSubscriptionId = planSubscription.subscriptionId;

    // Create an addon and its subscription
    const addon = await prisma.addOn.create({
      data: {
        userId: user.id,
        type: AddOnType.EXTRA_FUNNEL,
        quantity: 1,
        pricePerUnit: 15.0,
        status: "ACTIVE",
        billingCycle: "MONTH",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    const addonSubscription = await prisma.subscription.create({
      data: {
        subscriptionId: "SUB-ADDON-456",
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: "ACTIVE",
        userId: user.id,
        intervalUnit: "MONTH",
        intervalCount: 1,
        itemType: "ADDON",
        addonType: AddOnType.EXTRA_FUNNEL,
        rawData: {},
      },
    });

    addonSubscriptionId = addonSubscription.subscriptionId;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.subscription.deleteMany({
      where: { userId: { in: [userId, otherUserId] } },
    });
    await prisma.addOn.deleteMany({
      where: { userId: { in: [userId, otherUserId] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [userId, otherUserId] } },
    });
    await prisma.$disconnect();
  });

  describe("Plan Subscription Cancellation", () => {
    it("should successfully cancel a plan subscription", async () => {
      const result = await CancelSubscriptionService.cancel(
        planSubscriptionId,
        userId
      );

      expect(result.message).toContain("cancelled successfully");
      expect(result.message).toContain("retain access");
      expect(result.subscriptionId).toBe(planSubscriptionId);
      expect(result.status).toBe("CANCELLED");
      expect(result.endsAt).toBeDefined();
      expect(result.itemType).toBe("PLAN");

      // Verify in database
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { subscriptionId: planSubscriptionId },
      });

      expect(updatedSubscription?.status).toBe("CANCELLED");
    });

    it("should keep the same endsAt date after cancellation", async () => {
      // Create a new subscription to test
      const newSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "SUB-KEEP-DATE-111",
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: "ACTIVE",
          userId: userId,
          intervalUnit: "YEAR",
          intervalCount: 1,
          itemType: "PLAN",
          subscriptionType: UserPlan.BUSINESS,
          rawData: {},
        },
      });

      const originalEndsAt = newSubscription.endsAt;

      await CancelSubscriptionService.cancel(
        newSubscription.subscriptionId,
        userId
      );

      // Verify endsAt hasn't changed
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { subscriptionId: newSubscription.subscriptionId },
      });

      expect(updatedSubscription?.endsAt.getTime()).toBe(
        originalEndsAt.getTime()
      );

      // Cleanup
      await prisma.subscription.delete({
        where: { id: newSubscription.id },
      });
    });
  });

  describe("Addon Subscription Cancellation", () => {
    it("should successfully cancel an addon subscription and update addon status", async () => {
      const result = await CancelSubscriptionService.cancel(
        addonSubscriptionId,
        userId
      );

      expect(result.message).toContain("cancelled successfully");
      expect(result.subscriptionId).toBe(addonSubscriptionId);
      expect(result.status).toBe("CANCELLED");
      expect(result.itemType).toBe("ADDON");
      expect(result.addonType).toBe(AddOnType.EXTRA_FUNNEL);

      // Verify subscription in database
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { subscriptionId: addonSubscriptionId },
      });

      expect(updatedSubscription?.status).toBe("CANCELLED");

      // Verify addon status is also updated
      const updatedAddon = await prisma.addOn.findFirst({
        where: {
          userId,
          type: AddOnType.EXTRA_FUNNEL,
        },
      });

      expect(updatedAddon?.status).toBe("CANCELLED");
    });
  });

  describe("Error Cases", () => {
    it("should handle already cancelled subscription gracefully", async () => {
      // Create a cancelled subscription
      const cancelledSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "SUB-CANCELLED-999",
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: "CANCELLED",
          userId: userId,
          intervalUnit: "YEAR",
          intervalCount: 1,
          itemType: "PLAN",
          subscriptionType: UserPlan.BUSINESS,
          rawData: {},
        },
      });

      // The service itself doesn't check status - that's controller's job
      // Service will try to update it, which should work but not change anything
      const result = await CancelSubscriptionService.cancel(
        cancelledSubscription.subscriptionId,
        userId
      );

      expect(result.status).toBe("CANCELLED");

      // Cleanup
      await prisma.subscription.delete({
        where: { id: cancelledSubscription.id },
      });
    });

    it("should handle non-existent subscription", async () => {
      await expect(
        CancelSubscriptionService.cancel("SUB-NONEXISTENT", userId)
      ).rejects.toThrow();
    });
  });

  describe("Subscription Validator Integration", () => {
    it("cancelled subscriptions should still be valid until endsAt", async () => {
      const { SubscriptionValidator } = await import(
        "../../utils/subscription-utils/subscription-validator"
      );

      // Get the cancelled subscription
      const subscription = await prisma.subscription.findUnique({
        where: { subscriptionId: planSubscriptionId },
      });

      expect(subscription?.status).toBe("CANCELLED");

      // Should still be valid because endsAt is in the future
      expect(SubscriptionValidator.isValid(subscription!)).toBe(true);
    });

    it("cancelled addon should still be valid until endDate", async () => {
      const { SubscriptionValidator } = await import(
        "../../utils/subscription-utils/subscription-validator"
      );

      // Get the cancelled addon
      const addon = await prisma.addOn.findFirst({
        where: {
          userId,
          type: AddOnType.EXTRA_FUNNEL,
        },
      });

      expect(addon?.status).toBe("CANCELLED");

      // Should still be valid because endDate is in the future
      expect(SubscriptionValidator.isAddonValid(addon!)).toBe(true);
    });

    it("expired cancelled subscription should not be valid", async () => {
      const { SubscriptionValidator } = await import(
        "../../utils/subscription-utils/subscription-validator"
      );

      // Create an expired cancelled subscription
      const expiredSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "SUB-EXPIRED-CANCELLED-888",
          startsAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          endsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Expired yesterday
          status: "CANCELLED",
          userId: userId,
          intervalUnit: "YEAR",
          intervalCount: 1,
          itemType: "PLAN",
          subscriptionType: UserPlan.BUSINESS,
          rawData: {},
        },
      });

      // Should NOT be valid because endsAt is in the past
      expect(SubscriptionValidator.isValid(expiredSubscription)).toBe(false);

      // Cleanup
      await prisma.subscription.delete({
        where: { id: expiredSubscription.id },
      });
    });
  });
});
