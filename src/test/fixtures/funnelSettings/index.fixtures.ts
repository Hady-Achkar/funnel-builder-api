import { FunnelSettings } from "../../../generated/prisma-client";

export type CreateFunnelSettingsPayload = Pick<
  FunnelSettings,
  | "id"
  | "funnelId"
  | "defaultSeoTitle"
  | "defaultSeoDescription"
  | "defaultSeoKeywords"
  | "favicon"
  | "ogImage"
  | "googleAnalyticsId"
  | "facebookPixelId"
  | "cookieConsentText"
  | "privacyPolicyUrl"
  | "termsOfServiceUrl"
>;
