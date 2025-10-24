import { getPrisma } from "../../lib/prisma";
import type {
  EligiblePayment,
  CommissionReleaseResult,
  CommissionReleaseError,
  CommissionReleaseSummary,
} from "../../types/cron/commission-release.types";
import { sendCommissionReleasedEmail } from "./email-notifications/commission-released";

/**
 * Commission Release Service
 *
 * Releases affiliate commissions that have been held for 30 days.
 *
 * Process:
 * 1. Find payments where commissionHeldUntil < NOW() and status = PENDING
 * 2. For each payment:
 *    a. Update Payment: commissionStatus → RELEASED, set commissionReleasedAt
 *    b. Update User: move commission from pendingBalance → balance
 *    c. Update BalanceTransaction: COMMISSION_HOLD → COMMISSION_RELEASE, set releasedAt
 *    d. Send notification email to affiliate owner
 */
export class CommissionReleaseService {
  /**
   * Main entry point: Release all eligible commissions
   */
  static async releaseEligibleCommissions(): Promise<CommissionReleaseSummary> {
    const startTime = Date.now();

    console.log("[CommissionRelease] Starting commission release process...");

    const releasedPayments: CommissionReleaseResult[] = [];
    const failedPayments: CommissionReleaseError[] = [];
    let totalAmount = 0;

    try {
      // 1. Find all eligible payments
      const eligiblePayments = await this.findEligiblePayments();

      console.log(
        `[CommissionRelease] Found ${eligiblePayments.length} eligible payments`
      );

      if (eligiblePayments.length === 0) {
        console.log("[CommissionRelease] No commissions to release");
        return {
          success: true,
          totalEligible: 0,
          totalReleased: 0,
          totalFailed: 0,
          totalAmount: 0,
          releasedPayments: [],
          failedPayments: [],
          executionTime: Date.now() - startTime,
        };
      }

      // 2. Process each payment
      for (const payment of eligiblePayments) {
        try {
          console.log(
            `[CommissionRelease] Processing payment ${payment.id} (${payment.transactionId})`
          );

          const result = await this.releaseCommission(payment);

          releasedPayments.push(result);
          totalAmount += result.commissionAmount;

          console.log(
            `[CommissionRelease] ✅ Released ${result.commissionAmount} for payment ${result.paymentId}`
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;

          failedPayments.push({
            paymentId: payment.id,
            transactionId: payment.transactionId,
            error: errorMessage,
            stack: errorStack,
          });

          console.error(
            `[CommissionRelease] ❌ Failed to release commission for payment ${payment.id}:`,
            errorMessage
          );
        }
      }

      // 3. Send consolidated email notifications (group by affiliate)
      await this.sendNotifications(releasedPayments);

      const summary: CommissionReleaseSummary = {
        success: failedPayments.length === 0,
        totalEligible: eligiblePayments.length,
        totalReleased: releasedPayments.length,
        totalFailed: failedPayments.length,
        totalAmount,
        releasedPayments,
        failedPayments,
        executionTime: Date.now() - startTime,
      };

      console.log("[CommissionRelease] Process completed:", {
        totalEligible: summary.totalEligible,
        totalReleased: summary.totalReleased,
        totalFailed: summary.totalFailed,
        totalAmount: `$${summary.totalAmount.toFixed(2)}`,
        executionTime: `${summary.executionTime}ms`,
      });

      return summary;
    } catch (error) {
      console.error(
        "[CommissionRelease] Fatal error in commission release process:",
        error
      );
      throw error;
    }
  }

  /**
   * Find all payments eligible for commission release
   *
   * Criteria:
   * - commissionStatus = "PENDING" (still on hold)
   * - commissionHeldUntil < NOW() (30 days have passed)
   * - commissionAmount > 0 (has commission)
   * - status = "captured" (payment succeeded, not refunded)
   */
  private static async findEligiblePayments(): Promise<EligiblePayment[]> {
    const prisma = getPrisma();

    const payments = await prisma.payment.findMany({
      where: {
        commissionStatus: "PENDING",
        commissionHeldUntil: {
          lt: new Date(), // Earlier than now (30 days have passed)
        },
        commissionAmount: {
          gt: 0,
        },
        status: "captured", // Only captured payments, not refunded
      },
      include: {
        affiliateLink: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                balance: true,
                pendingBalance: true,
              },
            },
          },
        },
      },
      orderBy: {
        commissionHeldUntil: "asc", // Process oldest first
      },
    });

    return payments as EligiblePayment[];
  }

  /**
   * Release commission for a single payment
   *
   * This method performs all updates in a database transaction for atomicity:
   * 1. Update Payment table: PENDING → RELEASED
   * 2. Update User balances: pendingBalance → balance (atomic)
   * 3. Update BalanceTransaction: COMMISSION_HOLD → COMMISSION_RELEASE
   */
  private static async releaseCommission(
    payment: EligiblePayment
  ): Promise<CommissionReleaseResult> {
    const prisma = getPrisma();
    const now = new Date();

    const affiliateOwner = payment.affiliateLink.user;
    const commissionAmount = payment.commissionAmount;

    console.log("[CommissionRelease] Releasing commission:", {
      paymentId: payment.id,
      affiliateOwnerId: affiliateOwner.id,
      amount: commissionAmount,
      currentBalance: affiliateOwner.balance,
      currentPendingBalance: affiliateOwner.pendingBalance,
    });

    // Perform all updates in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Payment: Mark commission as released and affiliate as paid
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          commissionStatus: "RELEASED",
          commissionReleasedAt: now,
          affiliatePaid: true,
        },
      });

      console.log(
        `[CommissionRelease] Updated payment ${payment.id}: PENDING → RELEASED`
      );

      // 2. Update User: Move commission from pending → available balance (atomic)
      const updatedUser = await tx.user.update({
        where: { id: affiliateOwner.id },
        data: {
          pendingBalance: {
            decrement: commissionAmount,
          },
          balance: {
            increment: commissionAmount,
          },
        },
      });

      console.log(
        `[CommissionRelease] Updated user ${affiliateOwner.id} balance:`,
        {
          pendingBalance: `${affiliateOwner.pendingBalance} → ${updatedUser.pendingBalance}`,
          availableBalance: `${affiliateOwner.balance} → ${updatedUser.balance}`,
        }
      );

      // 3. Update existing BalanceTransaction: COMMISSION_HOLD → COMMISSION_RELEASE
      const balanceTransaction = await tx.balanceTransaction.findFirst({
        where: {
          userId: affiliateOwner.id,
          type: "COMMISSION_HOLD",
          referenceType: "Payment",
          referenceId: payment.id,
        },
      });

      if (!balanceTransaction) {
        throw new Error(
          `COMMISSION_HOLD BalanceTransaction not found for payment ${payment.id}`
        );
      }

      await tx.balanceTransaction.update({
        where: { id: balanceTransaction.id },
        data: {
          type: "COMMISSION_RELEASE", // Change type from HOLD to RELEASE
          balanceAfter: updatedUser.balance, // Update final balance
          releasedAt: now, // Set release timestamp
          notes: `${balanceTransaction.notes} | Released after 30-day hold period on ${now.toISOString()}`,
        },
      });

      console.log(
        `[CommissionRelease] Updated BalanceTransaction ${balanceTransaction.id}: COMMISSION_HOLD → COMMISSION_RELEASE for payment ${payment.id}`
      );

      return {
        paymentId: payment.id,
        transactionId: payment.transactionId,
        affiliateOwnerId: affiliateOwner.id,
        commissionAmount,
        previousBalance: affiliateOwner.balance,
        newBalance: updatedUser.balance,
        previousPendingBalance: affiliateOwner.pendingBalance,
        newPendingBalance: updatedUser.pendingBalance,
        releasedAt: now,
      };
    });

    return result;
  }

  /**
   * Send email notifications to affiliates whose commissions were released
   *
   * Groups commissions by affiliate owner to send one email per affiliate
   * (instead of one email per payment)
   */
  private static async sendNotifications(
    releasedPayments: CommissionReleaseResult[]
  ): Promise<void> {
    if (releasedPayments.length === 0) {
      return;
    }

    // Group by affiliate owner
    const groupedByAffiliate = releasedPayments.reduce((acc, payment) => {
      const affiliateId = payment.affiliateOwnerId;

      if (!acc[affiliateId]) {
        acc[affiliateId] = [];
      }

      acc[affiliateId].push(payment);
      return acc;
    }, {} as Record<number, CommissionReleaseResult[]>);

    console.log(
      `[CommissionRelease] Sending ${
        Object.keys(groupedByAffiliate).length
      } notification emails...`
    );

    // Send one email per affiliate
    for (const [affiliateId, payments] of Object.entries(groupedByAffiliate)) {
      try {
        const firstPayment = payments[0];
        const totalAmount = payments.reduce(
          (sum, p) => sum + p.commissionAmount,
          0
        );
        const paymentIds = payments.map((p) => p.paymentId);

        // Get affiliate owner details
        const prisma = getPrisma();
        const affiliateOwner = await prisma.user.findUnique({
          where: { id: parseInt(affiliateId) },
          select: {
            email: true,
            firstName: true,
            lastName: true,
            balance: true,
          },
        });

        if (!affiliateOwner) {
          console.warn(
            `[CommissionRelease] Affiliate owner ${affiliateId} not found, skipping email`
          );
          continue;
        }

        await sendCommissionReleasedEmail({
          affiliateOwnerEmail: affiliateOwner.email,
          affiliateOwnerName: `${affiliateOwner.firstName} ${affiliateOwner.lastName}`,
          commissionAmount: totalAmount,
          newAvailableBalance: affiliateOwner.balance,
          numberOfCommissions: payments.length,
          paymentIds,
        });

        console.log(
          `[CommissionRelease] ✅ Sent notification email to ${
            affiliateOwner.email
          } (${payments.length} commissions, $${totalAmount.toFixed(2)})`
        );
      } catch (emailError) {
        console.error(
          `[CommissionRelease] ⚠️  Failed to send email to affiliate ${affiliateId}:`,
          emailError
        );
        // Don't throw - email failure shouldn't rollback the commission release
      }
    }
  }
}
