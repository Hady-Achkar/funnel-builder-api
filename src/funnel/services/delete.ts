import { z } from "zod";
import {
  DeleteFunnelParamsSchema,
  DeleteFunnelResponse,
} from "../types/delete-funnel.types";
import { cacheService } from "../../services/cache/cache.service";
import { getPrisma } from "../../lib/prisma";

export const deleteFunnel = async (
  funnelId: number,
  userId: number
): Promise<DeleteFunnelResponse> => {
  try {
    if (!userId) throw new Error("Please provide userId.");

    const validatedParams = DeleteFunnelParamsSchema.parse({ funnelId });
    const validFunnelId = validatedParams.funnelId;

    const prisma = getPrisma();

    const funnel = await prisma.funnel.findUnique({
      where: { id: validFunnelId },
      select: {
        id: true,
        userId: true,
        name: true,
        status: true,
        themeId: true,
      },
    });

    if (!funnel) throw new Error("Funnel not found.");
    if (funnel.userId !== userId)
      throw new Error("You can't delete this funnel.");
    if (funnel.status === "LIVE")
      throw new Error(
        "This funnel is live. Switch it to Draft or Archived first."
      );

    await prisma.$transaction(async (tx) => {
      await tx.page.deleteMany({ where: { funnelId: validFunnelId } });
      if (funnel.themeId) {
        await tx.theme.delete({ where: { id: funnel.themeId } });
      }
      await tx.funnel.delete({ where: { id: validFunnelId, userId } });
    });

    try {
      await cacheService.invalidateUserFunnelCache(userId, validFunnelId);
    } catch (e) {
      console.warn("Deleted funnel, but cache couldn't be cleared:", e);
    }

    const response = {
      name: funnel.name,
    };

    return response as DeleteFunnelResponse;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Failed to delete funnel: ${error.message}`);
    }
    throw new Error("Couldn't delete the funnel. Please try again.");
  }
};
