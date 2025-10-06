import { Prisma, PrismaClient } from "../../../../generated/prisma-client";
import {
  CreateFunnelPayload,
  CreateFunnelSettingsPayload,
  CreateHomePagePayload,
} from "../../../../types/funnel/create";
import { $Enums } from "../../../../generated/prisma-client";

interface FunnelCreationResult {
  funnel: {
    id: number;
    name: string;
    slug: string;
    status: $Enums.FunnelStatus;
    workspaceId: number;
    createdBy: number;
    activeThemeId: number | null;
    activeTheme: {
      id: number;
      type: $Enums.ThemeType;
    } | null;
    pages: Array<{
      id: number;
      name: string;
      order: number;
      linkingId: string | null;
      seoTitle: string | null;
      seoDescription: string | null;
      seoKeywords: string | null;
      type: $Enums.PageType;
    }>;
  };
  homePage: {
    id: number;
    name: string;
    order: number;
    linkingId: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    seoKeywords: string | null;
    type: $Enums.PageType;
  };
}

export const createFunnelInTransaction = async (
  prisma: PrismaClient,
  data: {
    name: string;
    slug: string;
    status: $Enums.FunnelStatus;
    workspaceId: number;
    userId: number;
  }
): Promise<FunnelCreationResult> => {
  return await prisma.$transaction(async (tx) => {
    const createFunnelData: CreateFunnelPayload = {
      name: data.name,
      slug: data.slug,
      status: data.status,
      workspaceId: data.workspaceId,
      createdBy: data.userId,
    };

    const funnel = await tx.funnel.create({
      data: createFunnelData,
    });

    const theme = await tx.theme.create({
      data: {
        funnelId: funnel.id,
        type: $Enums.ThemeType.CUSTOM,
      },
    });

    // Set the active theme for the funnel
    await tx.funnel.update({
      where: { id: funnel.id },
      data: { activeThemeId: theme.id },
    });

    const createFunnelSettingsData: CreateFunnelSettingsPayload = {
      funnelId: funnel.id,
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
    };

    await tx.funnelSettings.create({
      data: createFunnelSettingsData,
    });

    const createHomePageData: CreateHomePagePayload = {
      name: "Home",
      content: "",
      order: 1,
      funnelId: funnel.id,
      linkingId: "home",
      type: $Enums.PageType.PAGE,
    };

    const homePage = await tx.page.create({
      data: createHomePageData,
      select: {
        id: true,
        name: true,
        order: true,
        linkingId: true,
        seoTitle: true,
        seoDescription: true,
        seoKeywords: true,
        type: true,
      },
    });

    const funnelResult = {
      id: funnel.id,
      name: funnel.name,
      slug: funnel.slug,
      status: funnel.status,
      workspaceId: funnel.workspaceId,
      createdBy: funnel.createdBy,
      activeThemeId: theme.id,
      activeTheme: {
        id: theme.id,
        type: $Enums.ThemeType.CUSTOM,
      },
      pages: [homePage],
    };

    return { funnel: funnelResult, homePage };
  });
};
