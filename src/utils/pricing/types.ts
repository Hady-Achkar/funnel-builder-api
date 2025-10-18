import { z } from "zod";
import { $Enums } from "../../generated/prisma-client";

export const planPriceConfigSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  frequency: z.enum(["monthly", "annually", "weekly"]),
  frequencyInterval: z.number().min(1, "Frequency interval must be at least 1"),
  freeTrialPeriodInDays: z.number().min(0, "Free trial period cannot be negative"),
});

export type PlanPriceConfig = z.infer<typeof planPriceConfigSchema>;

export const paymentLinkMetadataSchema = z.object({
  returnUrl: z.string().min(1, "Return URL is required"),
  failureReturnUrl: z.string().min(1, "Failure return URL is required"),
  termsAndConditionsUrl: z.string().min(1, "Terms and conditions URL is required"),
});

export type PaymentLinkMetadata = z.infer<typeof paymentLinkMetadataSchema>;

export const pricingLookupResultSchema = z.object({
  config: planPriceConfigSchema,
  metadata: paymentLinkMetadataSchema,
});

export type PricingLookupResult = z.infer<typeof pricingLookupResultSchema>;

export const pricingLookupInputSchema = z.object({
  paymentType: z.nativeEnum($Enums.PaymentType),
  planType: z.nativeEnum($Enums.UserPlan),
  registrationSource: z.nativeEnum($Enums.RegistrationSource),
});

export type PricingLookupInput = z.infer<typeof pricingLookupInputSchema>;

export const addonPriceConfigSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  frequency: z.enum(["monthly", "annually", "weekly"]),
  frequencyInterval: z.number().min(1, "Frequency interval must be at least 1"),
  freeTrialPeriodInDays: z.number().min(0, "Free trial period cannot be negative"),
  effectDescription: z.string().min(1, "Effect description is required"),
});

export type AddonPriceConfig = z.infer<typeof addonPriceConfigSchema>;

export const addonPricingLookupInputSchema = z.object({
  paymentType: z.nativeEnum($Enums.PaymentType),
  addonType: z.nativeEnum($Enums.AddOnType),
  workspacePlanType: z.nativeEnum($Enums.UserPlan),
});

export type AddonPricingLookupInput = z.infer<typeof addonPricingLookupInputSchema>;

export interface PaymentLinkPricingConfig {
  PLAN_PURCHASE: {
    [key in $Enums.RegistrationSource]?: {
      [key in $Enums.UserPlan]?: PlanPriceConfig;
    };
  };
  ADDON_PURCHASE: {
    [key in $Enums.UserPlan]?: {
      [key in $Enums.AddOnType]?: AddonPriceConfig;
    };
  };
  ADDON_RENEWAL: {
    [key in $Enums.UserPlan]?: {
      [key in $Enums.AddOnType]?: AddonPriceConfig;
    };
  };
}
