import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError } from "../../../errors";
import { WorkspaceRole, WorkspacePermission } from "../../../generated/prisma-client";

export const checkInsightUpdatePermission = async (
  userId: number,
  insightId: number
): Promise<void> => {
  const prisma = getPrisma();

  const insight = await prisma.insight.findUnique({
    where: { id: insightId },
    select: {
      id: true,
      funnel: {
        select: {
          id: true,
          createdBy: true,
          workspace: {
            select: {
              id: true,
              ownerId: true,
              members: {
                where: { userId },
                select: {
                  role: true,
                  permissions: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!insight) {
    throw new ForbiddenError("Insight not found");
  }

  const { funnel } = insight;
  const { workspace } = funnel;

  if (workspace.ownerId === userId) {
    return;
  }

  const member = workspace.members[0];
  if (!member) {
    throw new ForbiddenError("You do not have access to this workspace");
  }

  const { role, permissions } = member;

  switch (role as WorkspaceRole) {
    case WorkspaceRole.ADMIN:
      return;

    case WorkspaceRole.EDITOR:
    case WorkspaceRole.VIEWER:
      const userPermissions = permissions as WorkspacePermission[];
      if (!userPermissions?.includes(WorkspacePermission.EDIT_FUNNELS)) {
        throw new ForbiddenError(
          "You do not have permission to update insights in this funnel"
        );
      }
      return;

    default:
      throw new ForbiddenError("Invalid workspace role");
  }
};
