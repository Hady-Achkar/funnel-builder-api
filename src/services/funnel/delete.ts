import { DeleteFunnelResponse } from "../../types/funnel.types";
import { cacheService } from "../cache/cache.service";
import { getPrisma } from "../../lib/prisma";

export const deleteFunnel = async (
  funnelId: number,
  userId: number
): Promise<DeleteFunnelResponse> => {
  try {
    if (!funnelId || !userId)
      throw new Error("Please provide funnelId and userId.");

    const prisma = getPrisma();
    const funnel = await prisma.funnel.findUnique({
      where: { id: funnelId },
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
      await tx.page.deleteMany({ where: { funnelId } });
      await tx.theme.delete({ where: { id: funnel.themeId } });
      await tx.funnel.delete({ where: { id: funnelId, userId } });
    });

    try {
      // Invalidate cache (will clear all keys for this funnel)
      await cacheService.invalidateUserFunnelCache(userId, funnelId);
    } catch (e) {
      console.warn("Deleted funnel, but cache couldn't be cleared:", e);
    }

    return {
      id: funnel.id,
      name: funnel.name,
      message: `"${funnel.name}" was deleted successfully.`,
    };
  } catch (e) {
    console.error("Failed to delete funnel:", e);
    if (e instanceof Error) throw new Error(e.message);
    throw new Error("Couldn't delete the funnel. Please try again.");
  }
};
