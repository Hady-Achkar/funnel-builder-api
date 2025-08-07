import { UpdateFunnelData, FunnelWithPagesAndTheme } from "../../types/funnel.types";
import { getPrisma } from "../../lib/prisma";
import {
  validateUpdateInput,
  verifyFunnelOwnership,
  verifyDomainOwnership,
  handleDomainConnection,
  handleUpdateError,
} from "./helpers";
import { updateFunnelCache } from "./cache-helpers";

export const updateFunnel = async (
  funnelId: number,
  userId: number,
  data: UpdateFunnelData
): Promise<FunnelWithPagesAndTheme> => {
  try {
    validateUpdateInput(data);
    await verifyFunnelOwnership(funnelId, userId);

    if (data.domainId !== undefined && data.domainId !== null) {
      await verifyDomainOwnership(data.domainId, userId);
    }

    return await getPrisma().$transaction(async (transactionalPrisma) => {
      const funnelUpdateData: any = {};

      if (data.name !== undefined) {
        funnelUpdateData.name = data.name.trim();
      }

      if (data.status !== undefined) {
        funnelUpdateData.status = data.status.toUpperCase();
      }

      // Update database
      const updatedFunnel = await transactionalPrisma.funnel.update({
        where: { id: funnelId, userId },
        data: funnelUpdateData,
        include: {
          pages: {
            select: {
              id: true,
              name: true,
              order: true,
              linkingId: true,
              seoTitle: true,
              seoDescription: true,
              seoKeywords: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { order: "asc" },
          },
          theme: {
            select: {
              id: true,
              name: true,
              backgroundColor: true,
              textColor: true,
              buttonColor: true,
              buttonTextColor: true,
              borderColor: true,
              optionColor: true,
              fontFamily: true,
              borderRadius: true,
            },
          },
        },
      });

      // Handle domain connection if needed
      if (data.domainId !== undefined) {
        await handleDomainConnection(transactionalPrisma, funnelId, data.domainId);
      }

      // Update cache with selective field updates
      await updateFunnelCache(userId, funnelId, updatedFunnel, data);

      return updatedFunnel as FunnelWithPagesAndTheme;
    });
  } catch (error: any) {
    console.error("FunnelService.updateFunnel error:", error);
    throw handleUpdateError(error);
  }
};