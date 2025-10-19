import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import { setPrismaClient } from "../../lib/prisma";
import { PrismaClient } from "../../generated/prisma-client";
import { UserPlan, AddOnType } from "../../generated/prisma-client";
import { CancelSubscriptionService } from "../../services/subscription/cancel";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../errors";
import axios from "axios";

let prisma: PrismaClient;

// Mock console.log to avoid cluttering test output
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

// Mock axios for MamoPay API calls
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
    isAxiosError: vi.fn(),
  },
}));

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
        subscriberId: "MPB-SUBSCRIBER-PLAN-123",
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
        subscriberId: "MPB-SUBSCRIBER-ADDON-456",
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

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Mock MamoPay DELETE API - successful cancellation
    vi.mocked(axios.delete).mockResolvedValue({
      data: { success: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });
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
    it("should successfully cancel a plan subscription and unsubscribe from MamoPay", async () => {
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
      expect(result.mamopayCancelled).toBe(true); // NEW: Should be cancelled on MamoPay

      // Verify in database
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { subscriptionId: planSubscriptionId },
      });

      expect(updatedSubscription?.status).toBe("CANCELLED");

      // Verify MamoPay DELETE API was called with correct params
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining("/subscriptions/SUB-PLAN-123/subscribers/MPB-SUBSCRIBER-PLAN-123"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Bearer"),
          }),
        })
      );
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

  describe("MamoPay Unsubscribe Integration", () => {
    it("should successfully unsubscribe from MamoPay when subscriberId exists", async () => {
      // Create a subscription with subscriberId
      const testSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "SUB-MAMOPAY-SUCCESS",
          subscriberId: "MPB-SUBSCRIBER-SUCCESS",
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

      const result = await CancelSubscriptionService.cancel(
        testSubscription.subscriptionId,
        userId
      );

      // Verify local cancellation
      expect(result.status).toBe("CANCELLED");
      expect(result.mamopayCancelled).toBe(true);

      // Verify MamoPay DELETE API was called
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining("/subscriptions/SUB-MAMOPAY-SUCCESS/subscribers/MPB-SUBSCRIBER-SUCCESS"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Bearer"),
          }),
        })
      );

      // Cleanup
      await prisma.subscription.delete({
        where: { id: testSubscription.id },
      });
    });

    it("should handle MamoPay API failure gracefully and still cancel locally", async () => {
      // Mock MamoPay API to fail
      vi.mocked(axios.delete).mockRejectedValueOnce(new Error("MamoPay API unavailable"));

      // Create a subscription with subscriberId
      const testSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "SUB-MAMOPAY-FAIL",
          subscriberId: "MPB-SUBSCRIBER-FAIL",
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

      const result = await CancelSubscriptionService.cancel(
        testSubscription.subscriptionId,
        userId
      );

      // Verify local cancellation succeeded
      expect(result.status).toBe("CANCELLED");
      expect(result.mamopayCancelled).toBe(false); // Failed to cancel on MamoPay

      // Verify subscription is cancelled in database
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { subscriptionId: testSubscription.subscriptionId },
      });
      expect(updatedSubscription?.status).toBe("CANCELLED");

      // Cleanup
      await prisma.subscription.delete({
        where: { id: testSubscription.id },
      });

      // Reset mock
      vi.mocked(axios.delete).mockResolvedValue({
        data: { success: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });
    });

    it("should skip MamoPay cancellation when subscriberId is null", async () => {
      // Create a subscription without subscriberId
      const testSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "SUB-NO-SUBSCRIBER-ID",
          subscriberId: null, // No subscriberId
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

      // Clear mocks to verify axios.delete is not called
      vi.clearAllMocks();

      const result = await CancelSubscriptionService.cancel(
        testSubscription.subscriptionId,
        userId
      );

      // Verify local cancellation succeeded
      expect(result.status).toBe("CANCELLED");
      expect(result.mamopayCancelled).toBe(false); // No MamoPay cancellation attempted

      // Verify MamoPay API was NOT called
      expect(axios.delete).not.toHaveBeenCalled();

      // Cleanup
      await prisma.subscription.delete({
        where: { id: testSubscription.id },
      });
    });

    it("should handle MamoPay 404 error gracefully (subscriber already deleted)", async () => {
      // Mock MamoPay API to return 404
      const axiosError = new Error("Not Found");
      (axiosError as any).response = {
        status: 404,
        data: { error: "Subscriber not found" },
      };
      vi.mocked(axios.isAxiosError).mockReturnValue(true);
      vi.mocked(axios.delete).mockRejectedValueOnce(axiosError);

      // Create a subscription with subscriberId
      const testSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "SUB-MAMOPAY-404",
          subscriberId: "MPB-SUBSCRIBER-404",
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

      const result = await CancelSubscriptionService.cancel(
        testSubscription.subscriptionId,
        userId
      );

      // Verify local cancellation succeeded even though MamoPay returned 404
      expect(result.status).toBe("CANCELLED");
      expect(result.mamopayCancelled).toBe(false); // Failed on MamoPay side

      // Cleanup
      await prisma.subscription.delete({
        where: { id: testSubscription.id },
      });

      // Reset mocks
      vi.mocked(axios.delete).mockResolvedValue({
        data: { success: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });
    });

    it("should successfully cancel addon subscription on MamoPay", async () => {
      // Create an addon subscription with subscriberId
      const addon = await prisma.addOn.create({
        data: {
          userId: userId,
          type: AddOnType.EXTRA_WORKSPACE,
          quantity: 1,
          pricePerUnit: 999.0,
          status: "ACTIVE",
          billingCycle: "MONTH",
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const testSubscription = await prisma.subscription.create({
        data: {
          subscriptionId: "SUB-ADDON-MAMOPAY",
          subscriberId: "MPB-SUBSCRIBER-ADDON",
          startsAt: new Date(),
          endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "ACTIVE",
          userId: userId,
          intervalUnit: "MONTH",
          intervalCount: 1,
          itemType: "ADDON",
          addonType: AddOnType.EXTRA_WORKSPACE,
          rawData: {},
        },
      });

      const result = await CancelSubscriptionService.cancel(
        testSubscription.subscriptionId,
        userId
      );

      // Verify cancellation
      expect(result.status).toBe("CANCELLED");
      expect(result.itemType).toBe("ADDON");
      expect(result.addonType).toBe(AddOnType.EXTRA_WORKSPACE);
      expect(result.mamopayCancelled).toBe(true);

      // Verify MamoPay DELETE API was called
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining("/subscriptions/SUB-ADDON-MAMOPAY/subscribers/MPB-SUBSCRIBER-ADDON"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Bearer"),
          }),
        })
      );

      // Verify addon status updated
      const updatedAddon = await prisma.addOn.findUnique({
        where: { id: addon.id },
      });
      expect(updatedAddon?.status).toBe("CANCELLED");

      // Cleanup
      await prisma.subscription.delete({
        where: { id: testSubscription.id },
      });
      await prisma.addOn.delete({
        where: { id: addon.id },
      });
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
