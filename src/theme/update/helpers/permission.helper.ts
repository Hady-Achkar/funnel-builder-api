import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../../errors";
import { $Enums } from "../../../generated/prisma-client";

export interface ThemeUpdatePermissionResult {
  hasAccess: boolean;
  theme: {
    id: number;
    funnel: {
      id: number;
      name: string;
      workspaceId: number;
      createdBy: number;
    };
  };
  workspace: {
    id: number;
    name: string;
    ownerId: number;
  };
}

export const checkThemeUpdatePermissions = async (
  userId: number,
  themeId: number
): Promise<ThemeUpdatePermissionResult> => {
  const prisma = getPrisma();

  // Get theme with funnel and workspace details
  const theme = await prisma.theme.findUnique({
    where: { id: themeId },
    select: {
      id: true,
      funnel: {
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
      },
    },
  });

  if (!theme) {
    throw new NotFoundError("Theme not found");
  }

  if (!theme.funnel) {
    throw new NotFoundError("Theme is not associated with any funnel");
  }

  if (!theme.funnel.workspace) {
    throw new NotFoundError("Workspace not found for this theme");
  }

  // Check if user is workspace owner
  const isWorkspaceOwner = theme.funnel.workspace.ownerId === userId;
  let hasAccess = isWorkspaceOwner;

  if (!isWorkspaceOwner) {
    // Check if user is a workspace member with appropriate permissions
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userId,
          workspaceId: theme.funnel.workspaceId,
        },
      },
      select: {
        role: true,
        permissions: true,
      },
    });

    if (!workspaceMember) {
      throw new ForbiddenError("You don't have access to this theme");
    }

    // Check if user has permission to edit themes/funnels
    hasAccess =
      workspaceMember.role === $Enums.WorkspaceRole.OWNER ||
      workspaceMember.role === $Enums.WorkspaceRole.ADMIN ||
      workspaceMember.permissions.includes($Enums.WorkspacePermission.EDIT_FUNNELS);
  }

  if (!hasAccess) {
    throw new ForbiddenError(
      `You don't have permission to update themes in the funnel "${theme.funnel.name}"`
    );
  }

  return {
    hasAccess,
    theme: {
      id: theme.id,
      funnel: {
        id: theme.funnel.id,
        name: theme.funnel.name,
        workspaceId: theme.funnel.workspaceId,
        createdBy: theme.funnel.createdBy,
      },
    },
    workspace: theme.funnel.workspace,
  };
};