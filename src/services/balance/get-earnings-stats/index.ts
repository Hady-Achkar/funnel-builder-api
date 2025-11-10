import { getPrisma } from "../../../lib/prisma";
import { PayoutStatus } from "../../../generated/prisma-client";
import {
  GetEarningsStatsResponse,
  BalanceInfo,
  AffiliateStats,
} from "../../../types/balance/get-earnings-stats";

export class GetEarningsStatsService {
  static async getEarningsStats(userId: number): Promise<GetEarningsStatsResponse> {
    try {
      const prisma = getPrisma();

      // Query user data, affiliate links, and payout data in parallel
      const [user, userAffiliateLinks, totalWithdrawnResult, totalSubscribersCount] =
        await Promise.all([
          // Get user balance fields
          prisma.user.findUnique({
            where: { id: userId },
            select: {
              balance: true,
              pendingBalance: true,
            },
          }),

          // Get all user's affiliate links
          prisma.affiliateLink.findMany({
            where: { userId },
            select: {
              id: true,
              clickCount: true,
            },
          }),

          // Calculate total withdrawn (sum of completed payouts only)
          prisma.payout.aggregate({
            where: {
              userId,
              status: PayoutStatus.COMPLETED,
            },
            _sum: {
              amount: true,
            },
          }),

          // Count total subscribers across all user's affiliate links
          // We'll update this after we get the affiliate link IDs
          Promise.resolve(0), // Placeholder
        ]);

      if (!user) {
        throw new Error("User not found");
      }

      // Extract affiliate link IDs
      const affiliateLinkIds = userAffiliateLinks.map((link) => link.id);

      // Calculate total clicks across all affiliate links
      const totalClicks = userAffiliateLinks.reduce(
        (sum, link) => sum + link.clickCount,
        0
      );

      // Count total subscribers (users who used the referral link and have paid plans)
      const actualTotalSubscribers =
        affiliateLinkIds.length > 0
          ? await prisma.user.count({
              where: {
                referralLinkUsedId: {
                  in: affiliateLinkIds,
                },
                plan: {
                  not: "NO_PLAN",
                },
              },
            })
          : 0;

      // Calculate balance info
      const available = user.balance || 0;
      const pending = user.pendingBalance || 0;
      const totalWithdrawn = totalWithdrawnResult._sum.amount || 0;
      const total = available + pending + totalWithdrawn;

      const balanceInfo: BalanceInfo = {
        available,
        pending,
        total,
        totalWithdrawn,
      };

      // Calculate CVR (Conversion Rate)
      // CVR = (totalSubscribers / totalClicks) * 100
      // If no clicks, CVR is 0
      const totalCVR =
        totalClicks > 0
          ? (actualTotalSubscribers / totalClicks) * 100
          : 0;

      const affiliateStats: AffiliateStats = {
        totalSubscribers: actualTotalSubscribers,
        totalClicks,
        totalCVR: Number(totalCVR.toFixed(2)), // Round to 2 decimal places
      };

      return {
        balance: balanceInfo,
        affiliateStats,
      };
    } catch (error) {
      throw error;
    }
  }
}
