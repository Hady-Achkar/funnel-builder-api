import { FunnelStatus } from "../../generated/prisma-client";
import { CreateFunnelData, CreateFunnelResponse } from "../../types/funnel.types";
import { cacheService } from "../cache/cache.service";
import { getPrisma } from "../../lib/prisma";
import { validateCreateInput, handleCreateError } from "./helpers";

export const createFunnel = async (
  userId: number,
  data: CreateFunnelData
): Promise<CreateFunnelResponse> => {
  try {
    validateCreateInput(userId, data);

    const user = await getPrisma().user.findUnique({
      where: { id: userId },
      select: { id: true, maximumFunnels: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.maximumFunnels !== null) {
      const currentFunnelCount = await getPrisma().funnel.count({
        where: { userId },
      });

      if (currentFunnelCount >= user.maximumFunnels) {
        throw new Error(
          `Maximum funnel limit reached. You can create up to ${user.maximumFunnels} funnels.`
        );
      }
    }

    const trimmedName = data.name.trim();

    const result = await getPrisma().$transaction(async (transactionalPrisma) => {
      const createdFunnel = await transactionalPrisma.funnel.create({
        data: {
          name: trimmedName,
          status: data.status || FunnelStatus.DRAFT,
          userId,
        },
      });

      const defaultTheme = await transactionalPrisma.theme.create({
        data: {},
      });

      const updatedFunnel = await transactionalPrisma.funnel.update({
        where: { id: createdFunnel.id },
        data: { themeId: defaultTheme.id },
        include: {
          theme: true,
          pages: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              order: true,
              linkingId: true,
              seoTitle: true,
              seoDescription: true,
              seoKeywords: true,
            },
          },
        },
      });

      const homePage = await transactionalPrisma.page.create({
        data: {
          name: "Home",
          content: "",
          order: 1,
          funnelId: updatedFunnel.id,
          linkingId: "home",
        },
      });

      return { funnel: updatedFunnel, page: homePage };
    });

    // Cache the newly created funnel data with :full key
    const funnelFullDataToCache = {
      id: result.funnel.id,
      name: result.funnel.name,
      status: result.funnel.status,
      userId: result.funnel.userId,
      themeId: result.funnel.themeId,
      createdAt: result.funnel.createdAt,
      updatedAt: result.funnel.updatedAt,
      theme: result.funnel.theme,
      pages: [
        {
          id: result.page.id,
          name: result.page.name,
          order: result.page.order,
          linkingId: result.page.linkingId,
          seoTitle: result.page.seoTitle,
          seoDescription: result.page.seoDescription,
          seoKeywords: result.page.seoKeywords,
          createdAt: result.page.createdAt,
          updatedAt: result.page.updatedAt,
        },
      ],
    };

    try {
      // Cache the full funnel data forever (no TTL)
      await cacheService.setUserFunnelCache(
        userId,
        result.funnel.id,
        "full",
        funnelFullDataToCache,
        { ttl: 0 }
      );
      console.log(`Cached full funnel data for funnel ID: ${result.funnel.id}`);
    } catch (cacheError) {
      // Don't fail the entire operation if caching fails
      console.warn("Failed to cache full funnel data:", cacheError);
    }

    return {
      id: result.funnel.id,
      name: result.funnel.name,
      status: result.funnel.status,
      userId: result.funnel.userId,
      createdAt: result.funnel.createdAt,
      updatedAt: result.funnel.updatedAt,
      message: `Funnel "${result.funnel.name}" created successfully with a Home page`,
    };
  } catch (error: any) {
    console.error("FunnelService.createFunnel error:", error);
    throw handleCreateError(error);
  }
};