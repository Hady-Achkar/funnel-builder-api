import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../../errors";
import { $Enums } from "../../../generated/prisma-client";

export interface FunnelSettingsPermissionResult {
  hasAccess: boolean;
  funnel: {
    id: number;
    name: string;
    workspaceId: number;
  };
  workspace: {
    id: number;
    name: string;
    ownerId: number;
  };
}

export const checkFunnelSettingsPermissions = async (
  userId: number,
  funnelId: number
): Promise<FunnelSettingsPermissionResult> => {
  const prisma = getPrisma();

  // Get funnel with workspace details
  const funnel = await prisma.funnel.findUnique({
    where: { id: funnelId },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      workspace: {
        select: {
          id: true,
          name: true,
          ownerId: true,
        },
      },
    },
  });

  if (!funnel) {
    throw new NotFoundError("Funnel not found");
  }

  if (!funnel.workspace) {
    throw new NotFoundError("Workspace not found for this funnel");
  }

  // Check if user is workspace owner
  const isWorkspaceOwner = funnel.workspace.ownerId === userId;
  let hasAccess = isWorkspaceOwner;

  if (!isWorkspaceOwner) {
    // Check if user is a workspace member with funnel edit permissions
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userId,
          workspaceId: funnel.workspaceId,
        },
      },
      select: {
        role: true,
        permissions: true,
      },
    });

    if (!workspaceMember) {
      throw new ForbiddenError("You don't have access to this funnel");
    }

    // Only admins, owners, or users with EDIT_FUNNELS permission can modify funnel settings
    hasAccess =
      workspaceMember.role === $Enums.WorkspaceRole.OWNER ||
      workspaceMember.role === $Enums.WorkspaceRole.ADMIN ||
      workspaceMember.permissions.includes($Enums.WorkspacePermission.EDIT_FUNNELS);
  }

  if (!hasAccess) {
    throw new ForbiddenError(
      `You don't have permission to modify settings for funnel "${funnel.name}"`
    );
  }

  return {
    hasAccess,
    funnel: {
      id: funnel.id,
      name: funnel.name,
      workspaceId: funnel.workspaceId,
    },
    workspace: funnel.workspace,
  };
};