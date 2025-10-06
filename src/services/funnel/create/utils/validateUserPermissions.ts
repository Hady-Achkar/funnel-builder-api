import { PrismaClient } from "../../../../generated/prisma-client";
import { WorkspacePayload, WorkspaceMemberPayload } from "../../../../types/funnel/create";
import { hasPermissionToCreateFunnel } from "../../../../helpers/funnel/create";

export const validateUserPermissions = async (
  prisma: PrismaClient,
  userId: number,
  workspace: WorkspacePayload
): Promise<void> => {
  const isOwner = workspace.ownerId === userId;

  if (isOwner) {
    return;
  }

  const member = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: workspace.id,
      },
    },
    select: {
      role: true,
      permissions: true,
    },
  });

  if (!member) {
    throw new Error(
      `You don't have access to "${workspace.name}". Ask the owner to invite you first.`
    );
  }

  const canCreateFunnel = hasPermissionToCreateFunnel(
    member.role,
    member.permissions
  );

  if (!canCreateFunnel) {
    throw new Error(
      "You don't have permission to create funnels here. Contact your workspace admin for access."
    );
  }
};
