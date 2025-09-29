import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const getFunnelSettingsRequest = z.object({
  funnelId: z.number()
    .int("Funnel ID must be an integer")
    .positive("Funnel ID must be a positive number"),
});

export type GetFunnelSettingsRequest = z.infer<typeof getFunnelSettingsRequest>;

export const getFunnelSettingsResponse = z.object({
  id: z.number(),
  funnelId: z.number(),
  defaultSeoTitle: z.string().nullable(),
  defaultSeoDescription: z.string().nullable(),
  defaultSeoKeywords: z.string().nullable(),
  favicon: z.string().nullable(),
  ogImage: z.string().nullable(),
  googleAnalyticsId: z.string().nullable(),
  facebookPixelId: z.string().nullable(),
  customTrackingScripts: z.any(),
  enableCookieConsent: z.boolean(),
  cookieConsentText: z.string().nullable(),
  privacyPolicyUrl: z.string().nullable(),
  termsOfServiceUrl: z.string().nullable(),
  language: z.string().nullable(),
  timezone: z.string().nullable(),
  dateFormat: z.string().nullable(),
  isPasswordProtected: z.boolean(),
  funnelStatus: z.enum($Enums.FunnelStatus),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type GetFunnelSettingsResponse = z.infer<typeof getFunnelSettingsResponse>;