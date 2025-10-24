import { Funnel, Page, FunnelSettings, Theme } from "../../../../generated/prisma-client";
import {
  GetPublicSiteResponse,
  PublicPage,
  PublicSiteSettings,
  PublicSiteTheme,
} from "../../../../types/site/get-public-site";

interface FunnelWithRelations extends Funnel {
  pages: Page[];
  settings: FunnelSettings | null;
  customTheme: Theme | null;
}

export function formatSiteResponse(funnel: FunnelWithRelations): GetPublicSiteResponse {
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

  const customTheme: PublicSiteTheme | null = funnel.customTheme
    ? {
        primaryColor: funnel.customTheme.buttonColor,
        secondaryColor: funnel.customTheme.borderColor,
        fontFamily: funnel.customTheme.fontFamily,
        backgroundColor: funnel.customTheme.backgroundColor,
        textColor: funnel.customTheme.textColor,
        buttonColor: funnel.customTheme.buttonColor,
        buttonTextColor: funnel.customTheme.buttonTextColor,
        borderColor: funnel.customTheme.borderColor,
        optionColor: funnel.customTheme.optionColor,
        borderRadius: funnel.customTheme.borderRadius,
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
      customTheme,
    },
  };
}
