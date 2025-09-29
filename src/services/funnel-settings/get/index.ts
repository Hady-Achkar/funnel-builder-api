import { z } from "zod";
import {
  GetFunnelSettingsResponse,
  getFunnelSettingsRequest,
  getFunnelSettingsResponse,
} from "../../../types/funnel-settings/get";
import { cacheService } from "../../cache/cache.service";
import { getPrisma } from "../../../lib/prisma";

export const getFunnelSettings = async (
  funnelId: number
): Promise<GetFunnelSettingsResponse> => {
  try {
    const validatedData = getFunnelSettingsRequest.parse({ funnelId });
    const cacheKey = `funnel:${validatedData.funnelId}:settings:full`;
    const cachedSettings = await cacheService.get<GetFunnelSettingsResponse>(
      cacheKey
    );

    if (cachedSettings) {
      return getFunnelSettingsResponse.parse(cachedSettings);
    }

    const prisma = getPrisma();

    const settings = await prisma.funnelSettings.findUnique({
      where: { funnelId: validatedData.funnelId },
      include: {
        funnel: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!settings) {
      throw new Error("Funnel settings not found");
    }

    const responseData = {
      ...settings,
      funnelStatus: settings.funnel.status,
    };

    try {
      await cacheService.set(cacheKey, responseData, { ttl: 0 });
    } catch (cacheError) {
      console.warn("Failed to cache funnel settings:", cacheError);
    }

    return getFunnelSettingsResponse.parse(responseData);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Failed to get funnel settings: ${error.message}`);
    }
    throw new Error("Couldn't retrieve the funnel settings. Please try again.");
  }
};
