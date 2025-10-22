import { z } from "zod";
import { PayoutMethod, PayoutStatus } from "../../../generated/prisma-client";

// Request schema with conditional validation based on payment method
export const requestPayoutRequestSchema = z
  .object({
    amount: z
      .number()
      .positive("Please enter a valid amount")
      .min(50, "The minimum withdrawal amount is $50")
      .refine((val) => Number.isFinite(val), "Please enter a valid amount"),

    method: z.nativeEnum(PayoutMethod),

    // Bank-specific fields (for UAE_BANK and INTERNATIONAL_BANK)
    accountHolderName: z
      .string()
      .trim()
      .min(1, "Please provide your bank account holder name")
      .max(255, "Account holder name is too long")
      .optional(),

    bankName: z
      .string()
      .trim()
      .min(1, "Please provide your bank name")
      .max(255, "Bank name is too long")
      .optional(),

    accountNumber: z
      .string()
      .trim()
      .min(1, "Please provide your bank account number")
      .max(100, "Account number is too long")
      .optional(),

    // International bank specific
    swiftCode: z
      .string()
      .trim()
      .regex(
        /^[A-Z0-9]{8}$|^[A-Z0-9]{11}$/,
        "Please provide a valid SWIFT/BIC code (8 or 11 characters)"
      )
      .optional(),

    bankAddress: z
      .string()
      .trim()
      .min(1, "Please provide your bank's address for international transfer")
      .max(500, "Bank address is too long")
      .optional(),

    // USDT-specific fields
    usdtWalletAddress: z
      .string()
      .trim()
      .min(10, "Please provide a valid USDT wallet address")
      .max(200, "Wallet address is too long")
      .optional(),

    usdtNetwork: z.enum(["TRC20", "ERC20", "BEP20"]).optional(),

    // Optional notes from user
    userNotes: z
      .string()
      .trim()
      .max(1000, "Notes must be less than 1000 characters")
      .optional()
      .transform((val) => (val === "" ? null : val)),
  })
  .superRefine((data, ctx) => {
    // Validate bank transfer requirements
    if (data.method === "UAE_BANK" || data.method === "INTERNATIONAL_BANK") {
      // Check for invalid USDT fields FIRST (before checking missing bank fields)
      if (data.usdtWalletAddress || data.usdtNetwork) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Please remove cryptocurrency wallet details for bank transfer",
          path: ["usdtWalletAddress"],
        });
        return; // Stop validation here, don't check other fields
      }

      if (!data.accountHolderName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please provide your bank account holder name",
          path: ["accountHolderName"],
        });
      }

      if (!data.bankName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please provide your bank name",
          path: ["bankName"],
        });
      }

      if (!data.accountNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please provide your bank account number",
          path: ["accountNumber"],
        });
      }

      // Additional requirements for international transfers
      if (data.method === "INTERNATIONAL_BANK") {
        if (!data.swiftCode) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Please provide your bank's SWIFT/BIC code for international transfer",
            path: ["swiftCode"],
          });
        }

        if (!data.bankAddress) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Please provide your bank's address for international transfer",
            path: ["bankAddress"],
          });
        }
      }
    }

    // Validate USDT requirements
    if (data.method === "USDT") {
      // Check for invalid bank fields FIRST
      if (
        data.accountHolderName ||
        data.bankName ||
        data.accountNumber ||
        data.swiftCode ||
        data.bankAddress
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please remove bank details for cryptocurrency transfer",
          path: ["method"],
        });
        return; // Stop validation here
      }

      if (!data.usdtWalletAddress) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please provide your USDT wallet address",
          path: ["usdtWalletAddress"],
        });
      }
    }
  });

// Response schema
export const requestPayoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  payout: z.object({
    id: z.number(),
    amount: z.number(),
    fees: z.number(),
    netAmount: z.number(),
    method: z.nativeEnum(PayoutMethod),
    status: z.nativeEnum(PayoutStatus),
    accountHolderName: z.string().nullable().optional(),
    bankName: z.string().nullable().optional(),
    accountNumber: z.string().nullable().optional(),
    swiftCode: z.string().nullable().optional(),
    bankAddress: z.string().nullable().optional(),
    usdtWalletAddress: z.string().nullable().optional(),
    usdtNetwork: z.string().nullable().optional(),
    userNotes: z.string().nullable().optional(),
    createdAt: z.date(),
  }),
});

// Export inferred types
export type RequestPayoutRequest = z.infer<typeof requestPayoutRequestSchema>;
export type RequestPayoutResponse = z.infer<typeof requestPayoutResponseSchema>;

// For backward compatibility
export const requestPayoutRequest = requestPayoutRequestSchema;
export const requestPayoutResponse = requestPayoutResponseSchema;
