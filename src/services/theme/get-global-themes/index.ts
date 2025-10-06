import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../cache/cache.service";
import {
  GetGlobalThemesResponse,
  getGlobalThemesResponse,
} from "../../../types/theme/get-global-themes";
import { UnauthorizedError } from "../../../errors";
import { $Enums } from "../../../generated/prisma-client";

export const getGlobalThemes = async (
  userId: number
): Promise<GetGlobalThemesResponse> => {
  try {
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const cacheKey = "themes:global";

    // Try to get from cache first
    try {
      const cachedThemes = await cacheService.get<GetGlobalThemesResponse>(
        cacheKey
      );
      if (cachedThemes) {
        return getGlobalThemesResponse.parse(cachedThemes);
      }
    } catch (cacheError) {
      console.warn("Failed to get global themes from cache:", cacheError);
    }

    // Get from database if not in cache
    const prisma = getPrisma();
    const themes = await prisma.theme.findMany({
      where: {
        type: $Enums.ThemeType.GLOBAL,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    try {
      await cacheService.set(cacheKey, themes);
    } catch (cacheError) {
      console.warn("Failed to cache global themes:", cacheError);
    }

    const parsedThemes = getGlobalThemesResponse.parse(themes);
    return parsedThemes;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to get global themes");
  }
};
