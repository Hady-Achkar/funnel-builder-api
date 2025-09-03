import { z } from "zod";

export const updateFunnelSettingsRequest = z.object({
  funnelId: z.number()
    .int("Funnel ID must be an integer")
    .positive("Funnel ID must be a positive number"),
  
  defaultSeoTitle: z.string().nullable().optional(),
  
  defaultSeoDescription: z.string().nullable().optional(),
  
  defaultSeoKeywords: z.string().nullable().optional(),
  
  favicon: z.string().nullable().optional(),
  
  ogImage: z.string().nullable().optional(),
  
  googleAnalyticsId: z.string().nullable().optional(),
  
  facebookPixelId: z.string().nullable().optional(),
  
  customTrackingScripts: z.any().optional(),
  
  enableCookieConsent: z.boolean().optional(),
  
  cookieConsentText: z.string().nullable().optional(),
  
  privacyPolicyUrl: z.union([
    z.string().url("Privacy policy must be a valid URL"),
    z.literal(""),
    z.null()
  ]).optional().transform((val) => val === "" ? null : val),
  
  termsOfServiceUrl: z.union([
    z.string().url("Terms of service must be a valid URL"),
    z.literal(""),
    z.null()
  ]).optional().transform((val) => val === "" ? null : val),
  
  language: z.string().nullable().optional(),
  
  timezone: z.string().nullable().optional(),
  
  dateFormat: z.string().nullable().optional(),
});

export type UpdateFunnelSettingsRequest = z.infer<typeof updateFunnelSettingsRequest>;

export const updateFunnelSettingsResponse = z.object({
  message: z.string(),
  success: z.boolean(),
});

export type UpdateFunnelSettingsResponse = z.infer<typeof updateFunnelSettingsResponse>;