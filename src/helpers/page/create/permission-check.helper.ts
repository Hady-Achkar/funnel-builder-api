import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../../errors";
import { $Enums } from "../../../generated/prisma-client";

export interface FunnelEditPermissionResult {
  hasAccess: boolean;
  funnel: {
    id: number;
    name: string;
    workspaceId: number;
    createdBy: number;
  };
  workspace: {
    id: number;
    name: string;
    ownerId: number;
  };
}

export const checkFunnelEditPermissions = async (
  userId: number,
  funnelId: number
): Promise<FunnelEditPermissionResult> => {
  const prisma = getPrisma();

  // Get funnel with workspace details
  const funnel = await prisma.funnel.findUnique({
    where: { id: funnelId },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      createdBy: true,
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
    // Check if user is a workspace member with edit permissions
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

    // Check if user has permission to create pages
    hasAccess =
      workspaceMember.role === $Enums.WorkspaceRole.OWNER ||
      workspaceMember.role === $Enums.WorkspaceRole.ADMIN ||
      workspaceMember.permissions.includes($Enums.WorkspacePermission.EDIT_FUNNELS) ||
      workspaceMember.permissions.includes($Enums.WorkspacePermission.EDIT_PAGES);
  }

  if (!hasAccess) {
    throw new ForbiddenError(
      `You don't have permission to create pages in the funnel "${funnel.name}"`
    );
  }

  return {
    hasAccess,
    funnel: {
      id: funnel.id,
      name: funnel.name,
      workspaceId: funnel.workspaceId,
      createdBy: funnel.createdBy,
    },
    workspace: funnel.workspace,
  };
};