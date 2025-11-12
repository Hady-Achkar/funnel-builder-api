import { z } from "zod";
import { PageType } from "../../../generated/prisma-client";

// Request Schema
export const getPublicSiteRequestSchema = z.object({
  hostname: z.string().min(1, "Hostname parameter is required"),
  funnelSlug: z.string().min(1, "Funnel slug parameter is required"),
});

// Page Schema
export const publicPageSchema = z.object({
  id: z.number(),
  name: z.string(),
  linkingId: z.string().nullable(),
  order: z.number(),
  type: z.nativeEnum(PageType),
});

// Settings Schema
export const publicSiteSettingsSchema = z.object({
  favicon: z.string().nullable(),
  language: z.string().nullable(),
  passwordProtected: z.boolean(),
  socialPreview: z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
    image: z.string().nullable(),
  }),
  googleAnalyticsId: z.string().nullable(),
  facebookPixelId: z.string().nullable(),
  customTrackingScripts: z.any(),
  enableCookieConsent: z.boolean(),
  cookieConsentText: z.string().nullable(),
  privacyPolicyUrl: z.string().nullable(),
  termsOfServiceUrl: z.string().nullable(),
  timezone: z.string().nullable(),
  dateFormat: z.string().nullable(),
  defaultSeoKeywords: z.string().nullable(),
});

// Theme Schema
export const publicSiteThemeSchema = z.object({
  primaryColor: z.string(),
  secondaryColor: z.string(),
  fontFamily: z.string(),
  backgroundColor: z.string(),
  textColor: z.string(),
  buttonColor: z.string(),
  buttonTextColor: z.string(),
  borderColor: z.string(),
  optionColor: z.string(),
  borderRadius: z.string(),
});

// Response Schema
export const getPublicSiteResponseSchema = z.object({
  site: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    status: z.string(),
    workspaceId: z.number(),
    createdAt: z.date(),
    updatedAt: z.date(),
    pages: z.array(publicPageSchema),
    settings: publicSiteSettingsSchema,
    theme: publicSiteThemeSchema,
  }),
});

// Inferred Types
export type GetPublicSiteRequest = z.infer<typeof getPublicSiteRequestSchema>;
export type PublicPage = z.infer<typeof publicPageSchema>;
export type PublicSiteSettings = z.infer<typeof publicSiteSettingsSchema>;
export type PublicSiteTheme = z.infer<typeof publicSiteThemeSchema>;
export type GetPublicSiteResponse = z.infer<typeof getPublicSiteResponseSchema>;
