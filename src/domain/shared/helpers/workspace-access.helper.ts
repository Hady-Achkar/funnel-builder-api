import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../../errors/http-errors";
import { $Enums } from "../../../generated/prisma-client";

export interface WorkspaceAccessResult {
  hasAccess: boolean;
  workspace: {
    id: number;
    name: string;
    ownerId: number;
  };
  userRole: $Enums.WorkspaceRole;
  userPermissions: $Enums.WorkspacePermission[];
}

export const validateWorkspaceAccess = async (
  userId: number,
  workspaceId: number,
  requiredPermissions: $Enums.WorkspacePermission[] = []
): Promise<WorkspaceAccessResult> => {
  const prisma = getPrisma();

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });

  if (!workspace) {
    throw new NotFoundError(
      "You don't have access to this workspace or the workspace doesn't exist"
    );
  }

  const isWorkspaceOwner = workspace.ownerId === userId;
  let userRole: $Enums.WorkspaceRole;
  let userPermissions: $Enums.WorkspacePermission[] = [];
  let hasAccess = isWorkspaceOwner;

  if (isWorkspaceOwner) {
    userRole = $Enums.WorkspaceRole.OWNER;
  } else {
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      select: {
        role: true,
        permissions: true,
      },
    });

    if (!workspaceMember) {
      throw new NotFoundError(
        "You don't have access to this workspace or the workspace doesn't exist"
      );
    }

    userRole = workspaceMember.role;
    userPermissions = workspaceMember.permissions;
    hasAccess = true;
  }

  if (requiredPermissions.length > 0 && !isWorkspaceOwner) {
    const hasRequiredPermissions = requiredPermissions.some((permission) => {
      if (
        userRole === $Enums.WorkspaceRole.OWNER ||
        userRole === $Enums.WorkspaceRole.ADMIN
      ) {
        return true;
      }
      return userPermissions.includes(permission);
    });

    if (!hasRequiredPermissions) {
      throw new ForbiddenError(
        `You don't have the required permissions for this action in workspace "${workspace.name}". Contact an admin or owner for access.`
      );
    }
  }

  return {
    hasAccess,
    workspace,
    userRole,
    userPermissions,
  };
};
