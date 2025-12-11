import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  afterEach,
  beforeAll,
  afterAll,
} from "vitest";
import { CommissionReleaseService } from "../../services/cron/commission-release.service";
import { getPrisma, setPrismaClient } from "../../lib/prisma";
import { PrismaClient } from "../../generated/prisma-client";
import * as commissionReleasedEmail from "../../services/cron/email-notifications/commission-released";
import type { CommissionReleaseSummary } from "../../types/cron/commission-release.types";

// Mock the email notification module
vi.mock("../../services/cron/email-notifications/commission-released", () => ({
  sendCommissionReleasedEmail: vi.fn().mockResolvedValue(undefined),
}));

const prismaClient = new PrismaClient();
setPrismaClient(prismaClient);
const prisma = getPrisma();

describe("CommissionReleaseService", () => {
  beforeAll(async () => {
    // Setup test environment
    const dbUrl = process.env.DATABASE_URL || "";
    const dbName = dbUrl.split("/").pop()?.split("?")[0];
    console.log(
      `\n🔧 Running commission release tests against database: ${dbName}\n`
    );
  });

  afterAll(async () => {
    await prismaClient.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.balanceTransaction.deleteMany({
      where: {
        user: {
          email: {
            contains: "commissiontest",
          },
        },
      },
    });

    await prisma.payment.deleteMany({
      where: {
        transactionId: {
          contains: "COMMISSION_RELEASE_TEST",
        },
      },
    });

    await prisma.affiliateLink.deleteMany({
      where: {
        user: {
          email: {
            contains: "commissiontest",
          },
        },
      },
    });

    await prisma.workspace.deleteMany({
      where: {
        owner: {
          email: {
            contains: "commissiontest",
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "commissiontest",
        },
      },
    });

    // Clear email mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("releaseEligibleCommissions", () => {
    it("should return empty summary when no commissions are eligible", async () => {
      const summary =
        await CommissionReleaseService.releaseEligibleCommissions();

      expect(summary).toMatchObject({
        success: true,
        totalEligible: 0,
        totalReleased: 0,
        totalFailed: 0,
        totalAmount: 0,
        releasedPayments: [],
        failedPayments: [],
      });
      expect(summary.executionTime).toBeGreaterThanOrEqual(0);
    });

    it("should release a single eligible commission successfully", async () => {
      // 1. Create affiliate owner
      const affiliateOwner = await prisma.user.create({
        data: {
          email: "affiliateowner-commissiontest@example.com",
          username: "affiliateowner-commissiontest",
          firstName: "Affiliate",
          lastName: "Owner",
          password: "testpassword123",
          balance: 0,
          pendingBalance: 50, // $50 pending commission
        },
      });

      // 2. Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: "Test Workspace",
          slug: "test-workspace-commission",
          owner: {
            connect: {
              id: affiliateOwner.id,
            },
          },
        },
      });

      // 3. Create affiliate link
      const affiliateLink = await prisma.affiliateLink.create({
        data: {
          user: {
            connect: {
              id: affiliateOwner.id,
            },
          },
          workspace: {
            connect: {
              id: workspace.id,
            },
          },
          name: "Commission Test Link",
          token: "test_token_commission_release_001",
          itemType: "BUSINESS",
        },
      });

      // 3. Create buyer
      const buyer = await prisma.user.create({
        data: {
          email: "buyer-commissiontest@example.com",
          username: "buyer-commissiontest",
          firstName: "Test",
          lastName: "Buyer",
          password: "testpassword123",
        },
      });

      // 4. Create payment with commission held for 30+ days (already released)
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const payment = await prisma.payment.create({
        data: {
          transactionId: "COMMISSION_RELEASE_TEST_001",
          amount: 500,
          currency: "USD",
          status: "captured",
          buyerId: buyer.id,
          affiliateLinkId: affiliateLink.id,
          commissionAmount: 50, // $50 commission (10%)
          commissionStatus: "PENDING",
          commissionHeldUntil: thirtyOneDaysAgo, // Eligible for release
        },
      });

      // 5. Create initial COMMISSION_HOLD transaction
      await prisma.balanceTransaction.create({
        data: {
          userId: affiliateOwner.id,
          type: "COMMISSION_HOLD",
          amount: 50,
          balanceBefore: 0,
          balanceAfter: 0,
          referenceType: "Payment",
          referenceId: payment.id,
          notes: "Commission held for 30 days",
        },
      });

      // 6. Run commission release
      const summary =
        await CommissionReleaseService.releaseEligibleCommissions();

      // 7. Verify summary
      expect(summary.success).toBe(true);
      expect(summary.totalEligible).toBe(1);
      expect(summary.totalReleased).toBe(1);
      expect(summary.totalFailed).toBe(0);
      expect(summary.totalAmount).toBe(50);
      expect(summary.releasedPayments).toHaveLength(1);
      expect(summary.failedPayments).toHaveLength(0);

      const released = summary.releasedPayments[0];
      expect(released.paymentId).toBe(payment.id);
      expect(released.transactionId).toBe("COMMISSION_RELEASE_TEST_001");
      expect(released.affiliateOwnerId).toBe(affiliateOwner.id);
      expect(released.commissionAmount).toBe(50);
      expect(released.previousBalance).toBe(0);
      expect(released.newBalance).toBe(50);
      expect(released.previousPendingBalance).toBe(50);
      expect(released.newPendingBalance).toBe(0);
      expect(released.releasedAt).toBeInstanceOf(Date);

      // 8. Verify Payment table updated
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
      });
      expect(updatedPayment?.commissionStatus).toBe("RELEASED");
      expect(updatedPayment?.commissionReleasedAt).toBeInstanceOf(Date);

      // 9. Verify User balances updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: affiliateOwner.id },
      });
      expect(updatedUser?.balance).toBe(50); // Moved from pending to available
      expect(updatedUser?.pendingBalance).toBe(0);

      // 10. Verify BalanceTransaction created
      const releaseTransaction = await prisma.balanceTransaction.findFirst({
        where: {
          userId: affiliateOwner.id,
          type: "COMMISSION_RELEASE",
          referenceId: payment.id,
        },
      });
      expect(releaseTransaction).not.toBeNull();
      expect(releaseTransaction?.amount).toBe(50);
      expect(releaseTransaction?.balanceBefore).toBe(0);
      expect(releaseTransaction?.balanceAfter).toBe(50);
      expect(releaseTransaction?.releasedAt).toBeInstanceOf(Date);
      expect(releaseTransaction?.notes).toContain(
        "Released after 30-day hold period"
      );

      // 11. Verify email sent
      expect(
        commissionReleasedEmail.sendCommissionReleasedEmail
      ).toHaveBeenCalledTimes(1);
      expect(
        commissionReleasedEmail.sendCommissionReleasedEmail
      ).toHaveBeenCalledWith({
        affiliateOwnerEmail: "affiliateowner-commissiontest@example.com",
        affiliateOwnerName: "Affiliate Owner",
        commissionAmount: 50,
        newAvailableBalance: 50,
        numberOfCommissions: 1,
        paymentIds: [payment.id],
      });
    });

    it("should release multiple commissions for the same affiliate (single email)", async () => {
      // 1. Create affiliate owner
      const affiliateOwner = await prisma.user.create({
        data: {
          email: "multicommission-commissiontest@example.com",
          username: "multicommission-commissiontest",
          firstName: "Multi",
          lastName: "Commission",
          password: "testpassword123",
          balance: 100,
          pendingBalance: 150, // $150 pending ($50 + $100)
        },
      });

      // 2. Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: "Test Workspace",
          slug: "test-workspace-multi-commission",
          owner: {
            connect: {
              id: affiliateOwner.id,
            },
          },
        },
      });

      // 3. Create affiliate link
      const affiliateLink = await prisma.affiliateLink.create({
        data: {
          user: {
            connect: {
              id: affiliateOwner.id,
            },
          },
          workspace: {
            connect: {
              id: workspace.id,
            },
          },
          name: "Multi Commission Link",
          token: "test_token_multi_commission_002",
          itemType: "BUSINESS",
        },
      });

      // 3. Create buyer
      const buyer = await prisma.user.create({
        data: {
          email: "multibuyer-commissiontest@example.com",
          username: "multibuyer-commissiontest",
          firstName: "Multi",
          lastName: "Buyer",
          password: "testpassword123",
        },
      });

      // 4. Create two payments with eligible commissions
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const payment1 = await prisma.payment.create({
        data: {
          transactionId: "COMMISSION_RELEASE_TEST_002",
          amount: 500,
          currency: "USD",
          status: "captured",
          buyerId: buyer.id,
          affiliateLinkId: affiliateLink.id,
          commissionAmount: 50,
          commissionStatus: "PENDING",
          commissionHeldUntil: thirtyOneDaysAgo,
        },
      });

      const payment2 = await prisma.payment.create({
        data: {
          transactionId: "COMMISSION_RELEASE_TEST_003",
          amount: 1000,
          currency: "USD",
          status: "captured",
          buyerId: buyer.id,
          affiliateLinkId: affiliateLink.id,
          commissionAmount: 100,
          commissionStatus: "PENDING",
          commissionHeldUntil: thirtyOneDaysAgo,
        },
      });

      // Create COMMISSION_HOLD transactions for both payments
      await prisma.balanceTransaction.create({
        data: {
          userId: affiliateOwner.id,
          type: "COMMISSION_HOLD",
          amount: 50,
          balanceBefore: 0,
          balanceAfter: 0,
          referenceType: "Payment",
          referenceId: payment1.id,
          notes: "Commission held for 30 days",
        },
      });

      await prisma.balanceTransaction.create({
        data: {
          userId: affiliateOwner.id,
          type: "COMMISSION_HOLD",
          amount: 100,
          balanceBefore: 0,
          balanceAfter: 0,
          referenceType: "Payment",
          referenceId: payment2.id,
          notes: "Commission held for 30 days",
        },
      });

      // 5. Run commission release
      const summary =
        await CommissionReleaseService.releaseEligibleCommissions();

      // 6. Verify summary
      expect(summary.success).toBe(true);
      expect(summary.totalEligible).toBe(2);
      expect(summary.totalReleased).toBe(2);
      expect(summary.totalFailed).toBe(0);
      expect(summary.totalAmount).toBe(150); // $50 + $100

      // 7. Verify User balances updated correctly
      const updatedUser = await prisma.user.findUnique({
        where: { id: affiliateOwner.id },
      });
      expect(updatedUser?.balance).toBe(250); // 100 (initial) + 150 (released)
      expect(updatedUser?.pendingBalance).toBe(0); // 150 - 150

      // 8. Verify both payments updated
      const updatedPayment1 = await prisma.payment.findUnique({
        where: { id: payment1.id },
      });
      const updatedPayment2 = await prisma.payment.findUnique({
        where: { id: payment2.id },
      });
      expect(updatedPayment1?.commissionStatus).toBe("RELEASED");
      expect(updatedPayment2?.commissionStatus).toBe("RELEASED");

      // 9. Verify two BalanceTransaction records created
      const releaseTransactions = await prisma.balanceTransaction.findMany({
        where: {
          userId: affiliateOwner.id,
          type: "COMMISSION_RELEASE",
        },
      });
      expect(releaseTransactions).toHaveLength(2);

      // 10. Verify only ONE email sent (grouped by affiliate)
      expect(
        commissionReleasedEmail.sendCommissionReleasedEmail
      ).toHaveBeenCalledTimes(1);
      expect(
        commissionReleasedEmail.sendCommissionReleasedEmail
      ).toHaveBeenCalledWith({
        affiliateOwnerEmail: "multicommission-commissiontest@example.com",
        affiliateOwnerName: "Multi Commission",
        commissionAmount: 150, // Total of both commissions
        newAvailableBalance: 250,
        numberOfCommissions: 2,
        paymentIds: expect.arrayContaining([payment1.id, payment2.id]),
      });
    });

    it("should NOT release commissions that haven't reached 30 days yet", async () => {
      // 1. Create affiliate owner
      const affiliateOwner = await prisma.user.create({
        data: {
          email: "noteligible-commissiontest@example.com",
          username: "noteligible-commissiontest",
          firstName: "Not",
          lastName: "Eligible",
          password: "testpassword123",
          balance: 0,
          pendingBalance: 50,
        },
      });

      // 2. Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: "Test Workspace",
          slug: "test-workspace-noteligible-commission",
          owner: {
            connect: {
              id: affiliateOwner.id,
            },
          },
        },
      });

      // 3. Create affiliate link
      const affiliateLink = await prisma.affiliateLink.create({
        data: {
          user: {
            connect: {
              id: affiliateOwner.id,
            },
          },
          workspace: {
            connect: {
              id: workspace.id,
            },
          },
          name: "Not Eligible Link",
          token: "test_token_not_eligible_003",
          itemType: "BUSINESS",
        },
      });

      // 3. Create buyer
      const buyer = await prisma.user.create({
        data: {
          email: "noteligiblebuyer-commissiontest@example.com",
          username: "noteligiblebuyer-commissiontest",
          firstName: "Not",
          lastName: "Eligible",
          password: "testpassword123",
        },
      });

      // 4. Create payment with commission held for only 15 days (not eligible)
      const fifteenDaysFromNow = new Date();
      fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);

      const payment = await prisma.payment.create({
        data: {
          transactionId: "COMMISSION_RELEASE_TEST_004",
          amount: 500,
          currency: "USD",
          status: "captured",
          buyerId: buyer.id,
          affiliateLinkId: affiliateLink.id,
          commissionAmount: 50,
          commissionStatus: "PENDING",
          commissionHeldUntil: fifteenDaysFromNow, // Still 15 days to go
        },
      });

      // Create COMMISSION_HOLD transaction
      await prisma.balanceTransaction.create({
        data: {
          userId: affiliateOwner.id,
          type: "COMMISSION_HOLD",
          amount: 50,
          balanceBefore: 0,
          balanceAfter: 0,
          referenceType: "Payment",
          referenceId: payment.id,
          notes: "Commission held for 30 days",
        },
      });

      // 5. Run commission release
      const summary =
        await CommissionReleaseService.releaseEligibleCommissions();

      // 6. Verify nothing was released
      expect(summary.success).toBe(true);
      expect(summary.totalEligible).toBe(0);
      expect(summary.totalReleased).toBe(0);
      expect(summary.totalFailed).toBe(0);
      expect(summary.totalAmount).toBe(0);

      // 7. Verify User balances unchanged
      const updatedUser = await prisma.user.findUnique({
        where: { id: affiliateOwner.id },
      });
      expect(updatedUser?.balance).toBe(0);
      expect(updatedUser?.pendingBalance).toBe(50);

      // 8. Verify no email sent
      expect(
        commissionReleasedEmail.sendCommissionReleasedEmail
      ).not.toHaveBeenCalled();
    });

    it("should NOT release commissions for refunded payments", async () => {
      // 1. Create affiliate owner
      const affiliateOwner = await prisma.user.create({
        data: {
          email: "refunded-commissiontest@example.com",
          username: "refunded-commissiontest",
          firstName: "Refunded",
          lastName: "Payment",
          password: "testpassword123",
          balance: 0,
          pendingBalance: 50,
        },
      });

      // 2. Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: "Test Workspace",
          slug: "test-workspace-refunded-commission",
          owner: {
            connect: {
              id: affiliateOwner.id,
            },
          },
        },
      });

      // 3. Create affiliate link
      const affiliateLink = await prisma.affiliateLink.create({
        data: {
          user: {
            connect: {
              id: affiliateOwner.id,
            },
          },
          workspace: {
            connect: {
              id: workspace.id,
            },
          },
          name: "Refunded Link",
          token: "test_token_refunded_004",
          itemType: "BUSINESS",
        },
      });

      // 3. Create buyer
      const buyer = await prisma.user.create({
        data: {
          email: "refundedbuyer-commissiontest@example.com",
          username: "refundedbuyer-commissiontest",
          firstName: "Refunded",
          lastName: "Buyer",
          password: "testpassword123",
        },
      });

      // 4. Create refunded payment (even though 30 days passed)
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const payment = await prisma.payment.create({
        data: {
          transactionId: "COMMISSION_RELEASE_TEST_005",
          amount: 500,
          currency: "USD",
          status: "refunded", // Refunded payment
          buyerId: buyer.id,
          affiliateLinkId: affiliateLink.id,
          commissionAmount: 50,
          commissionStatus: "PENDING",
          commissionHeldUntil: thirtyOneDaysAgo,
        },
      });

      // Create COMMISSION_HOLD transaction
      await prisma.balanceTransaction.create({
        data: {
          userId: affiliateOwner.id,
          type: "COMMISSION_HOLD",
          amount: 50,
          balanceBefore: 0,
          balanceAfter: 0,
          referenceType: "Payment",
          referenceId: payment.id,
          notes: "Commission held for 30 days",
        },
      });

      // 5. Run commission release
      const summary =
        await CommissionReleaseService.releaseEligibleCommissions();

      // 6. Verify nothing was released
      expect(summary.success).toBe(true);
      expect(summary.totalEligible).toBe(0);
      expect(summary.totalReleased).toBe(0);

      // 7. Verify User balances unchanged
      const updatedUser = await prisma.user.findUnique({
        where: { id: affiliateOwner.id },
      });
      expect(updatedUser?.pendingBalance).toBe(50); // Still pending (not released)
    });

    it("should NOT release commissions that are already RELEASED", async () => {
      // 1. Create affiliate owner
      const affiliateOwner = await prisma.user.create({
        data: {
          email: "alreadyreleased-commissiontest@example.com",
          username: "alreadyreleased-commissiontest",
          firstName: "Already",
          lastName: "Released",
          password: "testpassword123",
          balance: 50, // Already in balance
          pendingBalance: 0,
        },
      });

      // 2. Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: "Test Workspace",
          slug: "test-workspace-alreadyreleased-commission",
          owner: {
            connect: {
              id: affiliateOwner.id,
            },
          },
        },
      });

      // 3. Create affiliate link
      const affiliateLink = await prisma.affiliateLink.create({
        data: {
          user: {
            connect: {
              id: affiliateOwner.id,
            },
          },
          workspace: {
            connect: {
              id: workspace.id,
            },
          },
          name: "Already Released Link",
          token: "test_token_already_released_005",
          itemType: "BUSINESS",
        },
      });

      // 3. Create buyer
      const buyer = await prisma.user.create({
        data: {
          email: "alreadyreleasedbuyer-commissiontest@example.com",
          username: "alreadyreleasedbuyer-commissiontest",
          firstName: "Already",
          lastName: "Released",
          password: "testpassword123",
        },
      });

      // 4. Create payment with RELEASED status
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      await prisma.payment.create({
        data: {
          transactionId: "COMMISSION_RELEASE_TEST_006",
          amount: 500,
          currency: "USD",
          status: "captured",
          buyerId: buyer.id,
          affiliateLinkId: affiliateLink.id,
          commissionAmount: 50,
          commissionStatus: "RELEASED", // Already released
          commissionHeldUntil: thirtyOneDaysAgo,
          commissionReleasedAt: thirtyOneDaysAgo,
        },
      });

      // 5. Run commission release
      const summary =
        await CommissionReleaseService.releaseEligibleCommissions();

      // 6. Verify nothing was released (idempotent)
      expect(summary.success).toBe(true);
      expect(summary.totalEligible).toBe(0);
      expect(summary.totalReleased).toBe(0);

      // 7. Verify User balances unchanged
      const updatedUser = await prisma.user.findUnique({
        where: { id: affiliateOwner.id },
      });
      expect(updatedUser?.balance).toBe(50);
      expect(updatedUser?.pendingBalance).toBe(0);

      // 8. Verify no email sent
      expect(
        commissionReleasedEmail.sendCommissionReleasedEmail
      ).not.toHaveBeenCalled();
    });

    it("should handle email failures gracefully without rolling back commission release", async () => {
      // Mock email to fail
      vi.mocked(
        commissionReleasedEmail.sendCommissionReleasedEmail
      ).mockRejectedValueOnce(new Error("SendGrid API error"));

      // 1. Create affiliate owner
      const affiliateOwner = await prisma.user.create({
        data: {
          email: "emailfail-commissiontest@example.com",
          username: "emailfail-commissiontest",
          firstName: "Email",
          lastName: "Fail",
          password: "testpassword123",
          balance: 0,
          pendingBalance: 50,
        },
      });

      // 2. Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: "Test Workspace",
          slug: "test-workspace-emailfail-commission",
          owner: {
            connect: {
              id: affiliateOwner.id,
            },
          },
        },
      });

      // 3. Create affiliate link
      const affiliateLink = await prisma.affiliateLink.create({
        data: {
          user: {
            connect: {
              id: affiliateOwner.id,
            },
          },
          workspace: {
            connect: {
              id: workspace.id,
            },
          },
          name: "Email Fail Link",
          token: "test_token_email_fail_006",
          itemType: "BUSINESS",
        },
      });

      // 3. Create buyer
      const buyer = await prisma.user.create({
        data: {
          email: "emailfailbuyer-commissiontest@example.com",
          username: "emailfailbuyer-commissiontest",
          firstName: "Email",
          lastName: "Fail",
          password: "testpassword123",
        },
      });

      // 4. Create eligible payment
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const payment = await prisma.payment.create({
        data: {
          transactionId: "COMMISSION_RELEASE_TEST_007",
          amount: 500,
          currency: "USD",
          status: "captured",
          buyerId: buyer.id,
          affiliateLinkId: affiliateLink.id,
          commissionAmount: 50,
          commissionStatus: "PENDING",
          commissionHeldUntil: thirtyOneDaysAgo,
        },
      });

      // Create COMMISSION_HOLD transaction
      await prisma.balanceTransaction.create({
        data: {
          userId: affiliateOwner.id,
          type: "COMMISSION_HOLD",
          amount: 50,
          balanceBefore: 0,
          balanceAfter: 0,
          referenceType: "Payment",
          referenceId: payment.id,
          notes: "Commission held for 30 days",
        },
      });

      // 5. Run commission release
      const summary =
        await CommissionReleaseService.releaseEligibleCommissions();

      // 6. Verify commission was still released despite email failure
      expect(summary.success).toBe(true);
      expect(summary.totalEligible).toBe(1);
      expect(summary.totalReleased).toBe(1);
      expect(summary.totalFailed).toBe(0);

      // 7. Verify Payment updated
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
      });
      expect(updatedPayment?.commissionStatus).toBe("RELEASED");

      // 8. Verify User balances updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: affiliateOwner.id },
      });
      expect(updatedUser?.balance).toBe(50);
      expect(updatedUser?.pendingBalance).toBe(0);

      // 9. Verify BalanceTransaction created
      const releaseTransaction = await prisma.balanceTransaction.findFirst({
        where: {
          userId: affiliateOwner.id,
          type: "COMMISSION_RELEASE",
        },
      });
      expect(releaseTransaction).not.toBeNull();
    });

    it("should release commissions for multiple different affiliates", async () => {
      // 1. Create first affiliate
      const affiliate1 = await prisma.user.create({
        data: {
          email: "affiliate1-commissiontest@example.com",
          username: "affiliate1-commissiontest",
          firstName: "Affiliate",
          lastName: "One",
          password: "testpassword123",
          balance: 0,
          pendingBalance: 50,
        },
      });

      // 2. Create workspace for first affiliate
      const workspace1 = await prisma.workspace.create({
        data: {
          name: "Test Workspace 1",
          slug: "test-workspace-1-commission",
          owner: {
            connect: {
              id: affiliate1.id,
            },
          },
        },
      });

      const link1 = await prisma.affiliateLink.create({
        data: {
          user: {
            connect: {
              id: affiliate1.id,
            },
          },
          workspace: {
            connect: {
              id: workspace1.id,
            },
          },
          name: "Affiliate 1 Link",
          token: "test_token_affiliate_1_007",
          itemType: "BUSINESS",
        },
      });

      // 3. Create second affiliate
      const affiliate2 = await prisma.user.create({
        data: {
          email: "affiliate2-commissiontest@example.com",
          username: "affiliate2-commissiontest",
          firstName: "Affiliate",
          lastName: "Two",
          password: "testpassword123",
          balance: 0,
          pendingBalance: 100,
        },
      });

      // 4. Create workspace for second affiliate
      const workspace2 = await prisma.workspace.create({
        data: {
          name: "Test Workspace 2",
          slug: "test-workspace-2-commission",
          owner: {
            connect: {
              id: affiliate2.id,
            },
          },
        },
      });

      const link2 = await prisma.affiliateLink.create({
        data: {
          user: {
            connect: {
              id: affiliate2.id,
            },
          },
          workspace: {
            connect: {
              id: workspace2.id,
            },
          },
          name: "Affiliate 2 Link",
          token: "test_token_affiliate_2_008",
          itemType: "BUSINESS",
        },
      });

      // 3. Create buyer
      const buyer = await prisma.user.create({
        data: {
          email: "multiaffiliate-commissiontest@example.com",
          username: "multiaffiliate-commissiontest",
          firstName: "Multi",
          lastName: "Affiliate",
          password: "testpassword123",
        },
      });

      // 4. Create payments for both affiliates
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const payment1 = await prisma.payment.create({
        data: {
          transactionId: "COMMISSION_RELEASE_TEST_008",
          amount: 500,
          currency: "USD",
          status: "captured",
          buyerId: buyer.id,
          affiliateLinkId: link1.id,
          commissionAmount: 50,
          commissionStatus: "PENDING",
          commissionHeldUntil: thirtyOneDaysAgo,
        },
      });

      const payment2 = await prisma.payment.create({
        data: {
          transactionId: "COMMISSION_RELEASE_TEST_009",
          amount: 1000,
          currency: "USD",
          status: "captured",
          buyerId: buyer.id,
          affiliateLinkId: link2.id,
          commissionAmount: 100,
          commissionStatus: "PENDING",
          commissionHeldUntil: thirtyOneDaysAgo,
        },
      });

      // Create COMMISSION_HOLD transactions for both payments
      await prisma.balanceTransaction.create({
        data: {
          userId: affiliate1.id,
          type: "COMMISSION_HOLD",
          amount: 50,
          balanceBefore: 0,
          balanceAfter: 0,
          referenceType: "Payment",
          referenceId: payment1.id,
          notes: "Commission held for 30 days",
        },
      });

      await prisma.balanceTransaction.create({
        data: {
          userId: affiliate2.id,
          type: "COMMISSION_HOLD",
          amount: 100,
          balanceBefore: 0,
          balanceAfter: 0,
          referenceType: "Payment",
          referenceId: payment2.id,
          notes: "Commission held for 30 days",
        },
      });

      // 5. Run commission release
      const summary =
        await CommissionReleaseService.releaseEligibleCommissions();

      // 6. Verify summary
      expect(summary.success).toBe(true);
      expect(summary.totalEligible).toBe(2);
      expect(summary.totalReleased).toBe(2);
      expect(summary.totalFailed).toBe(0);
      expect(summary.totalAmount).toBe(150);

      // 7. Verify both affiliates' balances updated correctly
      const updatedAffiliate1 = await prisma.user.findUnique({
        where: { id: affiliate1.id },
      });
      const updatedAffiliate2 = await prisma.user.findUnique({
        where: { id: affiliate2.id },
      });

      expect(updatedAffiliate1?.balance).toBe(50);
      expect(updatedAffiliate1?.pendingBalance).toBe(0);
      expect(updatedAffiliate2?.balance).toBe(100);
      expect(updatedAffiliate2?.pendingBalance).toBe(0);

      // 8. Verify TWO emails sent (one per affiliate)
      expect(
        commissionReleasedEmail.sendCommissionReleasedEmail
      ).toHaveBeenCalledTimes(2);

      // 9. Verify each email has correct data
      const emailCalls = vi.mocked(
        commissionReleasedEmail.sendCommissionReleasedEmail
      ).mock.calls;

      const affiliate1Email = emailCalls.find(
        (call) =>
          call[0].affiliateOwnerEmail ===
          "affiliate1-commissiontest@example.com"
      );
      const affiliate2Email = emailCalls.find(
        (call) =>
          call[0].affiliateOwnerEmail ===
          "affiliate2-commissiontest@example.com"
      );

      expect(affiliate1Email).toBeDefined();
      expect(affiliate1Email?.[0].commissionAmount).toBe(50);
      expect(affiliate1Email?.[0].numberOfCommissions).toBe(1);

      expect(affiliate2Email).toBeDefined();
      expect(affiliate2Email?.[0].commissionAmount).toBe(100);
      expect(affiliate2Email?.[0].numberOfCommissions).toBe(1);
    });

    it("should process payments in order of commissionHeldUntil (oldest first)", async () => {
      // 1. Create affiliate owner
      const affiliateOwner = await prisma.user.create({
        data: {
          email: "ordertest-commissiontest@example.com",
          username: "ordertest-commissiontest",
          firstName: "Order",
          lastName: "Test",
          password: "testpassword123",
          balance: 0,
          pendingBalance: 150,
        },
      });

      // 2. Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: "Test Workspace",
          slug: "test-workspace-ordertest-commission",
          owner: {
            connect: {
              id: affiliateOwner.id,
            },
          },
        },
      });

      // 3. Create affiliate link
      const affiliateLink = await prisma.affiliateLink.create({
        data: {
          user: {
            connect: {
              id: affiliateOwner.id,
            },
          },
          workspace: {
            connect: {
              id: workspace.id,
            },
          },
          name: "Order Test Link",
          token: "test_token_order_test_009",
          itemType: "BUSINESS",
        },
      });

      // 3. Create buyer
      const buyer = await prisma.user.create({
        data: {
          email: "orderbuyer-commissiontest@example.com",
          username: "orderbuyer-commissiontest",
          firstName: "Order",
          lastName: "Buyer",
          password: "testpassword123",
        },
      });

      // 4. Create three payments with different held until dates
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

      const thirtyFiveDaysAgo = new Date();
      thirtyFiveDaysAgo.setDate(thirtyFiveDaysAgo.getDate() - 35);

      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      // Create in random order (not chronological)
      const payment1 = await prisma.payment.create({
        data: {
          transactionId: "COMMISSION_RELEASE_TEST_011",
          amount: 500,
          currency: "USD",
          status: "captured",
          buyerId: buyer.id,
          affiliateLinkId: affiliateLink.id,
          commissionAmount: 50,
          commissionStatus: "PENDING",
          commissionHeldUntil: thirtyOneDaysAgo, // Newest
        },
      });

      const payment2 = await prisma.payment.create({
        data: {
          transactionId: "COMMISSION_RELEASE_TEST_010",
          amount: 500,
          currency: "USD",
          status: "captured",
          buyerId: buyer.id,
          affiliateLinkId: affiliateLink.id,
          commissionAmount: 50,
          commissionStatus: "PENDING",
          commissionHeldUntil: fortyDaysAgo, // Oldest
        },
      });

      const payment3 = await prisma.payment.create({
        data: {
          transactionId: "COMMISSION_RELEASE_TEST_012",
          amount: 500,
          currency: "USD",
          status: "captured",
          buyerId: buyer.id,
          affiliateLinkId: affiliateLink.id,
          commissionAmount: 50,
          commissionStatus: "PENDING",
          commissionHeldUntil: thirtyFiveDaysAgo, // Middle
        },
      });

      // Create COMMISSION_HOLD transactions for all three payments
      await prisma.balanceTransaction.create({
        data: {
          userId: affiliateOwner.id,
          type: "COMMISSION_HOLD",
          amount: 50,
          balanceBefore: 0,
          balanceAfter: 0,
          referenceType: "Payment",
          referenceId: payment1.id,
          notes: "Commission held for 30 days",
        },
      });

      await prisma.balanceTransaction.create({
        data: {
          userId: affiliateOwner.id,
          type: "COMMISSION_HOLD",
          amount: 50,
          balanceBefore: 0,
          balanceAfter: 0,
          referenceType: "Payment",
          referenceId: payment2.id,
          notes: "Commission held for 30 days",
        },
      });

      await prisma.balanceTransaction.create({
        data: {
          userId: affiliateOwner.id,
          type: "COMMISSION_HOLD",
          amount: 50,
          balanceBefore: 0,
          balanceAfter: 0,
          referenceType: "Payment",
          referenceId: payment3.id,
          notes: "Commission held for 30 days",
        },
      });

      // 5. Run commission release
      const summary =
        await CommissionReleaseService.releaseEligibleCommissions();

      // 6. Verify all released
      expect(summary.totalReleased).toBe(3);

      // 7. Verify they were processed in chronological order (oldest first)
      const releasedPayments = summary.releasedPayments;
      expect(releasedPayments[0].transactionId).toBe(
        "COMMISSION_RELEASE_TEST_010"
      ); // 40 days ago
      expect(releasedPayments[1].transactionId).toBe(
        "COMMISSION_RELEASE_TEST_012"
      ); // 35 days ago
      expect(releasedPayments[2].transactionId).toBe(
        "COMMISSION_RELEASE_TEST_011"
      ); // 31 days ago
    });
  });
});
