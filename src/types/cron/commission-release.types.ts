import { z } from "zod";

// Schema for eligible payment from database query
export const EligiblePaymentSchema = z.object({
  id: z.number().int().positive(),
  transactionId: z.string().min(1),
  commissionAmount: z.number().positive(),
  commissionHeldUntil: z.date(),
  buyerId: z.number().int().positive().nullable(),
  affiliateLinkId: z.number().int().positive(),
  affiliateLink: z.object({
    id: z.number().int().positive(),
    userId: z.number().int().positive(),
    user: z.object({
      id: z.number().int().positive(),
      email: z.string().email({ message: "Invalid email address" }),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      balance: z.number().min(0),
      pendingBalance: z.number().min(0),
    }),
  }),
});

export type EligiblePayment = z.infer<typeof EligiblePaymentSchema>;

// Schema for successful commission release result
export const CommissionReleaseResultSchema = z.object({
  paymentId: z.number().int().positive(),
  transactionId: z.string().min(1),
  affiliateOwnerId: z.number().int().positive(),
  commissionAmount: z.number().positive(),
  previousBalance: z.number().min(0),
  newBalance: z.number().min(0),
  previousPendingBalance: z.number().min(0),
  newPendingBalance: z.number().min(0),
  releasedAt: z.date(),
});

export type CommissionReleaseResult = z.infer<
  typeof CommissionReleaseResultSchema
>;

// Schema for commission release error
export const CommissionReleaseErrorSchema = z.object({
  paymentId: z.number().int().positive(),
  transactionId: z.string().min(1),
  error: z.string().min(1),
  stack: z.string().optional(),
});

export type CommissionReleaseError = z.infer<
  typeof CommissionReleaseErrorSchema
>;

// Schema for commission release summary
export const CommissionReleaseSummarySchema = z.object({
  success: z.boolean(),
  totalEligible: z.number().int().min(0),
  totalReleased: z.number().int().min(0),
  totalFailed: z.number().int().min(0),
  totalAmount: z.number().min(0),
  releasedPayments: z.array(CommissionReleaseResultSchema),
  failedPayments: z.array(CommissionReleaseErrorSchema),
  executionTime: z.number().positive(), // milliseconds
});

export type CommissionReleaseSummary = z.infer<
  typeof CommissionReleaseSummarySchema
>;

// Schema for commission released email data
export const CommissionReleasedEmailDataSchema = z.object({
  affiliateOwnerEmail: z.string().email({ message: "Invalid email address" }),
  affiliateOwnerName: z.string().min(1),
  commissionAmount: z.number().positive(),
  newAvailableBalance: z.number().min(0),
  numberOfCommissions: z.number().int().positive(),
  paymentIds: z.array(z.number().int().positive()).min(1),
});

export type CommissionReleasedEmailData = z.infer<
  typeof CommissionReleasedEmailDataSchema
>;
