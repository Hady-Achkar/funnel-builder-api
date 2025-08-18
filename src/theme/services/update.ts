import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import {
  UpdateThemeParams,
  UpdateThemeBody,
  UpdateThemeResponse,
  UpdateThemeParamsSchema,
  UpdateThemeBodySchema,
} from "../types/update-theme.types";

export const updateTheme = async (
  params: UpdateThemeParams,
  userId: number,
  body: UpdateThemeBody
): Promise<UpdateThemeResponse> => {
  try {
    const validatedParams = UpdateThemeParamsSchema.parse(params);
    const validatedBody = UpdateThemeBodySchema.parse(body);

    if (!validatedBody || Object.keys(validatedBody).length === 0) {
      throw new Error("No updates provided");
    }

    const prisma = getPrisma();

    const existingTheme = await prisma.theme.findFirst({
      where: { id: validatedParams.themeId },
      include: { funnel: true },
    });

    if (!existingTheme) throw new Error("Theme not found");

    if (!existingTheme.funnel) {
      throw new Error("You don't have permission to update this theme");
    }

    if (existingTheme.funnel.userId !== userId) {
      throw new Error("You don't have permission to update this theme");
    }

    const updatedTheme = await prisma.theme.update({
      where: { id: validatedParams.themeId },
      data: validatedBody,
    });

    const funnelId = existingTheme.funnel.id;

    try {
      const themeData = { ...updatedTheme };

      const summaryKey = `user:${userId}:funnel:${funnelId}:summary`;
      const cachedSummary = await cacheService.get<any>(summaryKey);

      if (cachedSummary) {
        const summaryDataCopy = { ...cachedSummary };
        await cacheService.del(summaryKey);

        summaryDataCopy.theme = themeData;
        summaryDataCopy.updatedAt = new Date();

        await cacheService.set(summaryKey, summaryDataCopy, { ttl: 0 });
      }

      const fullKey = `user:${userId}:funnel:${funnelId}:full`;
      const cachedFull = await cacheService.get<any>(fullKey);

      if (cachedFull) {
        const fullDataCopy = { ...cachedFull };
        await cacheService.del(fullKey);

        fullDataCopy.theme = themeData;
        fullDataCopy.updatedAt = new Date();

        await cacheService.set(fullKey, fullDataCopy, { ttl: 0 });
      }
    } catch (cacheError) {
      console.warn("Theme updated, but cache couldn't be updated:", cacheError);
    }

    return {
      message: "Theme updated successfully",
    };
  } catch (e) {
    console.error("Failed to update theme:", e);
    if (e instanceof Error) {
      // For ZodError, extract the first issue's message
      if (e.name === 'ZodError') {
        const zodError = e as any;
        const firstIssue = zodError.issues?.[0];
        if (firstIssue) {
          throw new Error(firstIssue.message);
        }
      }
      throw new Error(e.message);
    }
    throw new Error("Couldn't update the theme. Please try again.");
  }
};
