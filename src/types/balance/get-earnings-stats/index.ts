import { z } from "zod";

// Balance Info Schema
export const balanceInfoSchema = z.object({
  available: z.number(),
  pending: z.number(),
  total: z.number(),
  totalWithdrawn: z.number(),
});

// Affiliate Stats Schema
export const affiliateStatsSchema = z.object({
  totalSubscribers: z.number(),
  totalClicks: z.number(),
  totalCVR: z.number(), // Conversion Rate: (totalSubscribers / totalClicks) * 100
});

// Response Schema
export const getEarningsStatsResponseSchema = z.object({
  balance: balanceInfoSchema,
  affiliateStats: affiliateStatsSchema,
});

// Export inferred types
export type BalanceInfo = z.infer<typeof balanceInfoSchema>;
export type AffiliateStats = z.infer<typeof affiliateStatsSchema>;
export type GetEarningsStatsResponse = z.infer<typeof getEarningsStatsResponseSchema>;
