import { $Enums } from "../../generated/prisma-client";
import { DeleteFunnelResponse } from "../../types/funnel.types";
import { cacheService } from "../cache/cache.service";
import { getPrisma } from "../../lib/prisma";

export const deleteFunnel = async (
  funnelId: number,
  userId: number
): Promise<DeleteFunnelResponse> => {
  const funnelExists = await getPrisma().funnel.findUnique({
    where: { id: funnelId },
    select: { id: true, userId: true, name: true, status: true },
  });

  if (!funnelExists) {
    throw new Error("Funnel not found");
  }

  if (funnelExists.userId !== userId) {
    throw new Error("Access denied");
  }

  if (funnelExists.status === $Enums.FunnelStatus.LIVE) {
    throw new Error("Cannot delete a live funnel. Please change the status first.");
  }

  await getPrisma().$transaction(async (transactionalPrisma) => {
    await transactionalPrisma.page.deleteMany({
      where: { funnelId },
    });

    await transactionalPrisma.funnel.delete({
      where: { id: funnelId, userId },
    });

    // Invalidate cache after successful database deletion
    try {
      await cacheService.invalidateUserFunnelCache(userId, funnelId);
      console.log(`Invalidated cache for deleted funnel ID: ${funnelId}`);
    } catch (cacheError) {
      console.warn(`Failed to invalidate cache for funnel ${funnelId}:`, cacheError);
    }
  });

  return {
    id: funnelExists.id,
    name: funnelExists.name,
    message: `Funnel "${funnelExists.name}" has been deleted successfully`,
  };
};