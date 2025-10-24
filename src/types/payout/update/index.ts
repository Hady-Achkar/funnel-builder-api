import { z } from "zod";
import { PayoutStatus } from "../../../generated/prisma-client";

// Define valid status values
export const validPayoutStatuses = z.nativeEnum(PayoutStatus);

// Define valid admin codes
export const validAdminCodes = [
  "AALM",
  "ZALM",
  "MALM",
  "MALK",
  "HALA",
  "KALA",
] as const;
export const adminCodeSchema = z.enum(validAdminCodes, {
  message: "Invalid admin code",
});

// Admin history entry structure - captures full record state at time of update
export const adminHistoryEntrySchema = z.object({
  adminCode: adminCodeSchema,
  timestamp: z.string(),
  action: z.string(),
  previousStatus: validPayoutStatuses.nullable(),
  newStatus: validPayoutStatuses.nullable(),
  changes: z.record(z.string(), z.any()), // Fields that were changed in this update
  fullRecord: z.record(z.string(), z.any()), // Complete payout state after this update
});

export type AdminHistoryEntry = z.infer<typeof adminHistoryEntrySchema>;

// Request schema for updating payout
export const updatePayoutRequestSchema = z.object({
  // Admin code - REQUIRED for admin updates
  adminCode: adminCodeSchema.optional(),

  // Status can be updated by admin or creator (for CANCELLED only)
  status: validPayoutStatuses.optional(),

  // Admin-only fields
  documentUrl: z.string().url().optional(),
  documentType: z.string().optional(),
  transactionId: z.string().optional(),
  transactionProof: z.string().url().optional(),
  adminNotes: z
    .string()
    .max(2000, "Admin notes must be less than 2000 characters")
    .optional(),
  failureReason: z
    .string()
    .max(1000, "Failure reason must be less than 1000 characters")
    .optional(),
});

// Response schema
export const updatePayoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  payout: z.object({
    id: z.number(),
    userId: z.number(),
    amount: z.number(),
    fees: z.number(),
    netAmount: z.number(),
    status: validPayoutStatuses,
    method: z.string(),
    accountHolderName: z.string().nullable(),
    bankName: z.string().nullable(),
    accountNumber: z.string().nullable(),
    swiftCode: z.string().nullable(),
    bankAddress: z.string().nullable(),
    usdtWalletAddress: z.string().nullable(),
    usdtNetwork: z.string().nullable(),
    userNotes: z.string().nullable(),
    documentUrl: z.string().nullable(),
    documentType: z.string().nullable(),
    transactionId: z.string().nullable(),
    transactionProof: z.string().nullable(),
    adminNotes: z.string().nullable(),
    failureReason: z.string().nullable(),
    processedAt: z.date().nullable(),
    failedAt: z.date().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
});

// Export inferred types
export type UpdatePayoutRequest = z.infer<typeof updatePayoutRequestSchema>;
export type UpdatePayoutResponse = z.infer<typeof updatePayoutResponseSchema>;

// For backward compatibility
export const updatePayoutRequest = updatePayoutRequestSchema;
export const updatePayoutResponse = updatePayoutResponseSchema;
