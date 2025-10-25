import {
  Funnel,
  Page,
  FunnelSettings,
  Theme,
} from "../../../../generated/prisma-client";
import {
  GetPublicSiteResponse,
  PublicPage,
  PublicSiteSettings,
  PublicSiteTheme,
} from "../../../../types/site/get-public-site";

interface FunnelWithRelations extends Funnel {
  pages: Page[];
  settings: FunnelSettings | null;
  activeTheme: Theme;
}

export function formatSiteResponse(
  funnel: FunnelWithRelations
): GetPublicSiteResponse {
  const pages: PublicPage[] = funnel.pages
    .sort((a, b) => a.order - b.order)
    .map((page) => ({
      id: page.id,
      name: page.name,
      linkingId: page.linkingId,
      content: page.content,
      order: page.order,
      type: page.type,
      seoTitle: page.seoTitle,
      seoDescription: page.seoDescription,
      seoKeywords: page.seoKeywords,
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
