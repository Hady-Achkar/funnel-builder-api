import { FunnelStatus } from "../../generated/prisma-client";
import {
  CreateFunnelData,
  CreateFunnelResponse,
} from "../../types/funnel.types";
import { cacheService } from "../cache/cache.service";
import { getPrisma } from "../../lib/prisma";

export const createFunnel = async (
  userId: number,
  data: CreateFunnelData
): Promise<CreateFunnelResponse> => {
  try {
    if (!userId || !data.name) {
      throw new Error("User ID and funnel name are required");
    }

    const prisma = getPrisma();
    const name = data.name.trim();
    
    if (!name) {
      throw new Error("User ID and funnel name are required");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, maximumFunnels: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.maximumFunnels) {
      const count = await prisma.funnel.count({ where: { userId } });
      if (count >= user.maximumFunnels) {
        throw new Error(
          `You've reached your limit of ${user.maximumFunnels} funnels`
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const funnel = await tx.funnel.create({
        data: {
          name,
          status: data.status ?? FunnelStatus.DRAFT,
          userId,
        },
      });

      const theme = await tx.theme.create({ data: {} });

      const funnelWithTheme = await tx.funnel.update({
        where: { id: funnel.id },
        data: { themeId: theme.id },
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

      const homePage = await tx.page.create({
        data: {
          name: "Home",
          content: "",
          order: 1,
          funnelId: funnel.id,
          linkingId: "home",
        },
      });

      return { funnel: funnelWithTheme, homePage };
    });

    try {
      // Cache summary without pages
      const summaryData = {
        id: result.funnel.id,
        name: result.funnel.name,
        status: result.funnel.status,
        userId: result.funnel.userId,
        themeId: result.funnel.themeId,
        createdAt: result.funnel.createdAt,
        updatedAt: result.funnel.updatedAt,
        theme: result.funnel.theme,
      };

      await cacheService.setUserFunnelCache(
        userId,
        result.funnel.id,
        "summary",
        summaryData,
        { ttl: 0 }
      );
    } catch (cacheError) {
      console.warn("Cache update failed but funnel was created:", cacheError);
    }

    return {
      id: result.funnel.id,
      message: "A new funnel has been created successfully",
    };
  } catch (error: any) {
    console.error("Failed to create funnel:", error);
    if (error?.message?.includes?.("limit")) {
      throw error;
    }
    if (error?.message === "User not found") {
      throw error;
    }
    throw new Error("Failed to create funnel. Please try again.");
  }
};
