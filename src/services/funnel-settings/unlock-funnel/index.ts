import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors";
import {
  UnlockFunnelRequest,
  UnlockFunnelResponse,
  unlockFunnelRequest,
  unlockFunnelResponse,
} from "../../../types/funnel-settings/unlock-funnel";
import { ZodError } from "zod";
import { checkFunnelSettingsPermissions } from "../../../helpers/funnel-settings/unlock-funnel";
import { cacheService } from "../../cache/cache.service";

export const unlockFunnel = async (
  userId: number,
  data: Partial<UnlockFunnelRequest>
): Promise<UnlockFunnelResponse> => {
  try {
    if (!userId) throw new Error("User ID is required");

    const validatedRequest = unlockFunnelRequest.parse(data);

    await checkFunnelSettingsPermissions(userId, validatedRequest.funnelId);

    const prisma = getPrisma();

    await prisma.funnelSettings.update({
      where: { funnelId: validatedRequest.funnelId },
      data: {
        isPasswordProtected: false,
        passwordHash: null,
      },
    });

    const cacheKey = `funnel:${validatedRequest.funnelId}:settings:full`;
    try {
      await cacheService.del(cacheKey);
    } catch (cacheError) {
      console.warn("Failed to invalidate funnel settings cache:", cacheError);
    }

    const response = {
      message: "Funnel unlocked successfully",
      success: true,
    };

    return unlockFunnelResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
