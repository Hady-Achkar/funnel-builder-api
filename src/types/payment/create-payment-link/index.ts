import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const createPaymentLinkRequest = z.object({
  // Required fields
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Must be a valid email address"),

  paymentType: z.nativeEnum($Enums.PaymentType),
  planType: z.nativeEnum($Enums.UserPlan),

  planTitle: z.string().min(1, "Plan title is required"),
  planDescription: z.string().min(1, "Plan description is required"),

  amount: z.number().positive("Amount must be positive"),

  // Fields with defaults
  frequency: z.enum(["monthly", "annually", "weekly"]).default("monthly"),
  frequencyInterval: z
    .number()
    .min(1, "Frequency interval must be at least 1")
    .default(1),
  freeTrialPeriodInDays: z
    .number()
    .min(0, "Free trial period cannot be negative")
    .default(0),

  returnUrl: z.string().url("Return URL must be a valid URL"),
  failureReturnUrl: z.string().url("Failure return URL must be a valid URL"),
  termsAndConditionsUrl: z
    .string()
    .url("Terms and conditions URL must be a valid URL"),

  // Optional
  affiliateToken: z.string().optional(),
});

export type CreatePaymentLinkRequest = z.infer<typeof createPaymentLinkRequest>;

export const createPaymentLinkResponse = z.object({
  message: z.string(),
  paymentLink: z.object({
    id: z.string(),
    url: z.string(),
    paymentUrl: z.string(),
    title: z.string(),
    description: z.string(),
    amount: z.number(),
    currency: z.string(),
    frequency: z.enum(["monthly", "annually", "weekly"]),
    frequencyInterval: z.number(),
    trialPeriodDays: z.number(),
    active: z.boolean(),
    createdDate: z.string(),
    planType: z.nativeEnum($Enums.UserPlan),
  }),
});

export type CreatePaymentLinkResponse = z.infer<
  typeof createPaymentLinkResponse
>;
