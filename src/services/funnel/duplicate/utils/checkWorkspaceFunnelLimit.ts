import { PrismaClient } from "../../../../generated/prisma-client";

const WORKSPACE_FUNNEL_LIMIT = 3;

/**
 * Checks if the target workspace has reached its funnel limit
 *
 * Enforces a maximum of 3 funnels per workspace. This prevents
 * duplication if the workspace is already at capacity.
 *
 * @param prisma - Prisma client instance
 * @param workspaceId - ID of the target workspace to check
 * @throws Error if workspace has reached the limit of 3 funnels
 */
export const checkWorkspaceFunnelLimit = async (
  prisma: PrismaClient,
  workspaceId: number
): Promise<void> => {
  const currentFunnelCount = await prisma.funnel.count({
    where: { workspaceId },
  });

  if (currentFunnelCount >= WORKSPACE_FUNNEL_LIMIT) {
    throw new Error(
      `This workspace has reached its maximum limit of ${WORKSPACE_FUNNEL_LIMIT} funnels.`
    );
  }
};
