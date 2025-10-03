import { PrismaClient } from "../../../../generated/prisma-client";

const WORKSPACE_FUNNEL_LIMIT = 3;

export const checkWorkspaceFunnelLimit = async (
  prisma: PrismaClient,
  workspaceId: number
): Promise<void> => {
  const currentFunnelCount = await prisma.funnel.count({
    where: { workspaceId },
  });

  if (currentFunnelCount >= WORKSPACE_FUNNEL_LIMIT) {
    throw new Error(
      `You've reached the maximum of ${WORKSPACE_FUNNEL_LIMIT} funnels for this workspace`
    );
  }
};
