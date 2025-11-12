import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const getFunnelSettingsRequest = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  funnelSlug: z.string().min(1, "Funnel slug is required"),
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
  password: z.string().nullable(),
  funnelStatus: z.enum($Enums.FunnelStatus),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type GetFunnelSettingsResponse = z.infer<typeof getFunnelSettingsResponse>;