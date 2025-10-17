import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

/**
 * Simplified payment link request schema
 * All pricing and metadata are auto-populated from centralized pricing config
 * based on user's registrationSource and selected planType
 */
export const createPaymentLinkRequest = z.object({
  // Only required fields - pricing is auto-populated from centralized config
  paymentType: z.nativeEnum($Enums.PaymentType),
  planType: z.nativeEnum($Enums.UserPlan),
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
