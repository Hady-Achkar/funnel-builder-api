import { z } from "zod";
import { PayoutStatus, PayoutMethod } from "../../../generated/prisma-client";

// Request Schema
export const getBalanceHistoryRequestSchema = z.object({
  // Pagination
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive().max(100)),
  all: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .pipe(z.boolean()),

  // Filters
  status: z.nativeEnum(PayoutStatus).optional(),
  method: z.nativeEnum(PayoutMethod).optional(),
  startDate: z
    .union([z.string(), z.date()])
    .transform((val) => {
      if (typeof val === "string") {
        const date = new Date(val);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
      val.setUTCHours(0, 0, 0, 0);
      return val;
    })
    .optional(),
  endDate: z
    .union([z.string(), z.date()])
    .transform((val) => {
      if (typeof val === "string") {
        const date = new Date(val);
        date.setUTCHours(23, 59, 59, 999);
        return date;
      }
      val.setUTCHours(23, 59, 59, 999);
      return val;
    })
    .optional(),

  // Search
  search: z.string().optional(),

  // Sorting
  sortBy: z
    .enum(["createdAt", "amount", "status", "method"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Payout Summary Schema
export const payoutSummarySchema = z.object({
  id: z.number(),
  amount: z.number(),
  fees: z.number(),
  netAmount: z.number(),
  status: z.nativeEnum(PayoutStatus),
  method: z.nativeEnum(PayoutMethod),
  createdAt: z.date(),
  processedAt: z.date().nullable(),
  failureReason: z.string().nullable().optional(),
  accountHolderName: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  usdtWalletAddress: z.string().nullable().optional(),
});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

// Filters Schema
export const filtersSchema = z.object({
  status: z.nativeEnum(PayoutStatus).optional(),
  method: z.nativeEnum(PayoutMethod).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Response Schema
export const getBalanceHistoryResponseSchema = z.object({
  payouts: z.array(payoutSummarySchema),
  pagination: paginationSchema,
  filters: filtersSchema,
});

// Export inferred types
export type GetBalanceHistoryRequest = z.infer<
  typeof getBalanceHistoryRequestSchema
>;
export type PayoutSummary = z.infer<typeof payoutSummarySchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type Filters = z.infer<typeof filtersSchema>;
export type GetBalanceHistoryResponse = z.infer<
  typeof getBalanceHistoryResponseSchema
>;

// For backward compatibility
export const getBalanceHistoryRequest = getBalanceHistoryRequestSchema;
export const getBalanceHistoryResponse = getBalanceHistoryResponseSchema;
