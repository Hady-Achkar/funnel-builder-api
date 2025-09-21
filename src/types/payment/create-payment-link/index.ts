import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const createPaymentLinkRequest = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Must be a valid email address"),
  planType: z.enum($Enums.UserPlan, {
    message: `Plan type must be one of: ${Object.values($Enums.UserPlan).join(
      ", "
    )}`,
  }),
  planTitle: z.string().min(1, "Plan title is required"),
  planDescription: z.string().min(1, "Plan description is required"),
  amount: z.number().positive("Amount must be positive"),
  frequency: z.enum(["monthly", "annually", "weekly"]),
  frequencyInterval: z.number().min(1, "Frequency interval must be at least 1"),
  freeTrialPeriodInDays: z
    .number()
    .min(0, "Free trial period cannot be negative"),
  maximumFunnelsAllowed: z
    .number()
    .min(0, "Maximum funnels cannot be negative"),
  maximumSubdomainsAllowed: z
    .number()
    .min(0, "Maximum subdomains cannot be negative"),
  maximumCustomDomainsAllowed: z
    .number()
    .min(0, "Maximum custom domains cannot be negative"),
  maximumAdminsAllowed: z.number().min(1, "Must allow at least 1 admin"),
  returnUrl: z.string().min(1, "Return URL is required"),
  failureReturnUrl: z.string().url("Must be a valid URL"),
  termsAndConditionsUrl: z.string().url("Must be a valid URL"),
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
    planDetails: z.object({
      planType: z.enum($Enums.UserPlan),
      maximumFunnelsAllowed: z.number(),
      maximumSubdomainsAllowed: z.number(),
      maximumCustomDomainsAllowed: z.number(),
      maximumAdminsAllowed: z.number(),
    }),
  }),
});

export type CreatePaymentLinkResponse = z.infer<
  typeof createPaymentLinkResponse
>;
