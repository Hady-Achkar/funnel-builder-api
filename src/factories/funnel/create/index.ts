import { 
  CreateFunnelPayload, 
  CreateFunnelSettingsPayload, 
  CreateHomePagePayload,
  UpdateFunnelWithThemePayload
} from "../../../types/funnel/create";
import { $Enums } from "../../../generated/prisma-client";

/**
 * Factory function to create funnel payload
 */
export const createFunnelPayloadFactory = (
  name: string,
  slug: string,
  status: $Enums.FunnelStatus,
  workspaceId: number,
  createdBy: number
): CreateFunnelPayload => ({
  name,
  slug,
  status,
  workspaceId,
  createdBy,
});

/**
 * Factory function to create funnel settings payload with default values
 */
export const createFunnelSettingsPayloadFactory = (
  funnelId: number
): CreateFunnelSettingsPayload => ({
  funnelId,
  defaultSeoTitle: null,
  defaultSeoDescription: null,
  defaultSeoKeywords: null,
  favicon: null,
  ogImage: null,
  googleAnalyticsId: null,
  facebookPixelId: null,
  cookieConsentText: null,
  privacyPolicyUrl: null,
  termsOfServiceUrl: null,
});

/**
 * Factory function to create home page payload
 */
export const createHomePagePayloadFactory = (
  funnelId: number,
  name: string = "Home",
  linkingId: string = "home",
  content: string = "",
  order: number = 1
): CreateHomePagePayload => ({
  name,
  content,
  order,
  funnelId,
  linkingId,
});

/**
 * Factory function to create theme update payload
 */
export const updateFunnelWithThemePayloadFactory = (
  themeId: number
): UpdateFunnelWithThemePayload => ({
  themeId,
});

/**
 * All-in-one factory for common funnel creation payloads
 */
export const funnelCreationPayloads = {
  funnel: createFunnelPayloadFactory,
  settings: createFunnelSettingsPayloadFactory,
  homePage: createHomePagePayloadFactory,
  themeUpdate: updateFunnelWithThemePayloadFactory,
};