import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../../errors";
import { WorkspaceRole, WorkspacePermission } from "../../../generated/prisma-client";

export const checkInsightCreatePermission = async (
  userId: number,
  funnelId: number
): Promise<void> => {
  const prisma = getPrisma();

  const funnel = await prisma.funnel.findUnique({
    where: { id: funnelId },
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
  });

  if (!funnel) {
    throw new NotFoundError("Funnel not found");
  }

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
          "You do not have permission to create insights for this funnel"
        );
      }
      return;

    default:
      throw new ForbiddenError("Invalid workspace role");
  }
};
