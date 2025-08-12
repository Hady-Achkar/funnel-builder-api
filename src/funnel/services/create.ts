import { z } from "zod";
import {
  CreateFunnelData,
  CreateFunnelResponse,
  CreateFunnelSchema,
  CreateFunnelResponseSchema,
} from "../types";
import { cacheService } from "../../services/cache/cache.service";
import { getPrisma } from "../../lib/prisma";

export const createFunnel = async (
  userId: number,
  data: Partial<CreateFunnelData>
): Promise<CreateFunnelResponse> => {
  try {
    if (!userId) throw new Error("User ID is required");

    const validatedData = CreateFunnelSchema.parse(data);

    const prisma = getPrisma();

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
          name: validatedData.name,
          status: validatedData.status,
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

      const response = {
        message: "A new funnel has been created successfully",
        data: {
          id: funnelWithTheme.id,
          name: funnelWithTheme.name,
          status: funnelWithTheme.status,
        },
      };

      const validatedResponse = CreateFunnelResponseSchema.parse(response);

      return { funnel: funnelWithTheme, homePage, response: validatedResponse };
    });

    try {
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

    return result.response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      if (error.message.includes("limit")) {
        throw new Error(`Funnel creation limit reached: ${error.message}`);
      }
      if (error.message === "User not found") {
        throw new Error("Authentication failed: User account not found");
      }
      throw new Error(`Funnel creation failed: ${error.message}`);
    }

    throw new Error(
      "An unexpected error occurred while creating the funnel. Please try again or contact support if the problem persists."
    );
  }
};
