import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError } from "../../../errors";
import { WorkspaceRole, WorkspacePermission } from "../../../generated/prisma-client";

export const checkInsightDeletePermission = async (
  userId: number,
  insightId: number
): Promise<void> => {
  const prisma = getPrisma();

  // Get insight with funnel and workspace information
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

  // Check if user is workspace owner
  if (workspace.ownerId === userId) {
    return; // Owner has all permissions
  }

  // Check if user is workspace member
  const member = workspace.members[0];
  if (!member) {
    throw new ForbiddenError("You do not have access to this workspace");
  }

  // Check role-based permissions
  const { role, permissions } = member;

  switch (role as WorkspaceRole) {
    case WorkspaceRole.ADMIN:
      return; // Admin has all permissions

    case WorkspaceRole.EDITOR:
    case WorkspaceRole.VIEWER:
      // Check if user has edit funnel permissions
      const userPermissions = permissions as WorkspacePermission[];
      if (!userPermissions?.includes(WorkspacePermission.EDIT_FUNNELS)) {
        throw new ForbiddenError("You do not have permission to delete insights from this funnel");
      }
      return;

    default:
      throw new ForbiddenError("Invalid workspace role");
  }
};