import { PrismaClient } from "../../../../generated/prisma-client";

/**
 * Validates and retrieves the original funnel to be duplicated
 *
 * Fetches the funnel with all necessary data including:
 * - Active theme (to copy theme settings)
 * - Settings (to copy funnel settings excluding analytics IDs)
 * - Pages ordered by order field (to duplicate pages with new linking IDs)
 * - Workspace details (to validate permissions)
 *
 * @param prisma - Prisma client instance
 * @param funnelId - ID of the funnel to duplicate
 * @returns Original funnel with all related data
 * @throws Error if funnel is not found
 */
export const validateOriginalFunnel = async (
  prisma: PrismaClient,
  funnelId: number
) => {
  const originalFunnel = await prisma.funnel.findUnique({
    where: { id: funnelId },
    include: {
      activeTheme: true,
      settings: true,
      pages: {
        orderBy: { order: "asc" },
      },
      workspace: {
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      },
    },
  });

  if (!originalFunnel) {
    throw new Error("Funnel not found");
  }

  return originalFunnel;
};
