import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

// Standard authenticated request (existing behavior)
export const createPaymentLinkRequest = z.object({
  planType: z.nativeEnum($Enums.UserPlan),
});

export type CreatePaymentLinkRequest = z.infer<typeof createPaymentLinkRequest>;

// Partner plan request (public, unauthenticated) - when plan: "partner" is passed
// User details come from MamoPay customer_details after payment succeeds
export const createPartnerPaymentLinkRequest = z.object({
  plan: z.literal("partner"),
});

export type CreatePartnerPaymentLinkRequest = z.infer<
  typeof createPartnerPaymentLinkRequest
>;

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
