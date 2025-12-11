import {
  Funnel,
  FunnelSettings,
  Theme,
  PageType,
} from "../../../../generated/prisma-client";
import {
  GetPublicSiteResponse,
  PublicPage,
  PublicSiteSettings,
  PublicSiteTheme,
} from "../../../../types/site/get-public-site";

// Partial page type without content and SEO fields
interface PublicPageData {
  id: number;
  name: string;
  linkingId: string | null;
  order: number;
  type: PageType;
}

interface FunnelWithRelations extends Funnel {
  pages: PublicPageData[];
  settings: FunnelSettings | null;
  activeTheme: Theme;
}

export function formatSiteResponse(funnel: FunnelWithRelations): Omit<
  GetPublicSiteResponse,
  "requiresPassword" | "hasAccess" | "tokenExpiry"
> {
  // Sort pages: PAGE types first (by order), then RESULT types (by order)
  const pages: PublicPage[] = funnel.pages
    .sort((a, b) => {
      // PAGE type comes before RESULT type
      if (a.type !== b.type) {
        return a.type === PageType.PAGE ? -1 : 1;
      }
      // Within the same type, sort by order
      return a.order - b.order;
    })
    .map((page) => ({
      id: page.id,
      name: page.name,
      linkingId: page.linkingId,
      order: page.order,
      type: page.type,
      // content, seoTitle, seoDescription, seoKeywords excluded
    }));

  const settings: PublicSiteSettings = funnel.settings
    ? {
        favicon: funnel.settings.favicon,
        language: funnel.settings.language,
        passwordProtected: funnel.settings.isPasswordProtected,
        socialPreview: {
          title: funnel.settings.defaultSeoTitle,
          description: funnel.settings.defaultSeoDescription,
          image: funnel.settings.ogImage,
        },
        googleAnalyticsId: funnel.settings.googleAnalyticsId,
        facebookPixelId: funnel.settings.facebookPixelId,
        customTrackingScripts: funnel.settings.customTrackingScripts,
        enableCookieConsent: funnel.settings.enableCookieConsent,
        cookieConsentText: funnel.settings.cookieConsentText,
        privacyPolicyUrl: funnel.settings.privacyPolicyUrl,
        termsOfServiceUrl: funnel.settings.termsOfServiceUrl,
        timezone: funnel.settings.timezone,
        dateFormat: funnel.settings.dateFormat,
        defaultSeoKeywords: funnel.settings.defaultSeoKeywords,
      }
    : {
        favicon: null,
        language: "en",
        passwordProtected: false,
        socialPreview: {
          title: null,
          description: null,
          image: null,
        },
        googleAnalyticsId: null,
        facebookPixelId: null,
        customTrackingScripts: [],
        enableCookieConsent: false,
        cookieConsentText: null,
        privacyPolicyUrl: null,
        termsOfServiceUrl: null,
        timezone: "UTC",
        dateFormat: "DD.MM.YYYY",
        defaultSeoKeywords: null,
      };

  const theme: PublicSiteTheme | null = funnel.activeTheme
    ? {
        primaryColor: funnel.activeTheme.buttonColor,
        secondaryColor: funnel.activeTheme.borderColor,
        fontFamily: funnel.activeTheme.fontFamily,
        backgroundColor: funnel.activeTheme.backgroundColor,
        textColor: funnel.activeTheme.textColor,
        buttonColor: funnel.activeTheme.buttonColor,
        buttonTextColor: funnel.activeTheme.buttonTextColor,
        borderColor: funnel.activeTheme.borderColor,
        optionColor: funnel.activeTheme.optionColor,
        borderRadius: funnel.activeTheme.borderRadius,
      }
    : null;

  return {
    site: {
      id: funnel.id,
      name: funnel.name,
      slug: funnel.slug,
      status: funnel.status,
      workspaceId: funnel.workspaceId,
      createdAt: funnel.createdAt,
      updatedAt: funnel.updatedAt,
      pages,
      settings,
      theme,
    },
  };
}
