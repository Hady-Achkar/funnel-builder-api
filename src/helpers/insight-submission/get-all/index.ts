import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../../errors";
import {
  WorkspaceRole,
  WorkspacePermission,
} from "../../../generated/prisma-client";

export const checkInsightSubmissionsViewPermission = async (
  userId: number,
  workspaceSlug: string,
  funnelSlug: string
): Promise<void> => {
  const prisma = getPrisma();

  // Find workspace by slug
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true },
  });

  if (!workspace) {
    throw new NotFoundError("Workspace not found");
  }

  // Get funnel with workspace information
  const funnel = await prisma.funnel.findFirst({
    where: {
      slug: funnelSlug,
      workspaceId: workspace.id,
    },
    select: {
      id: true,
      name: true,
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

  const { workspace: funnelWorkspace } = funnel;

  if (funnelWorkspace.ownerId === userId) {
    return;
  }

  const member = funnelWorkspace.members[0];
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
      if (!userPermissions?.includes(WorkspacePermission.VIEW_ANALYTICS)) {
        throw new ForbiddenError(
          "You do not have permission to view insight submissions for this funnel"
        );
      }
      return;

    default:
      throw new ForbiddenError("Invalid workspace role");
  }
};