import { cacheService } from "../../../services/cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../../errors";
import { $Enums } from "../../../generated/prisma-client";

export const updateThemeInCache = async (
  workspaceId: number | null,
  funnelId: number | null,
  isGlobalTheme: boolean
): Promise<void> => {
  try {
    if (isGlobalTheme) {
      // Invalidate global themes cache
      await cacheService.del("themes:global");
      console.log("Invalidated global themes cache");
    } else if (workspaceId && funnelId) {
      // Delete cache for custom theme
      const fullCacheKey = `workspace:${workspaceId}:funnel:${funnelId}:full`;
      await cacheService.del(fullCacheKey);
      console.log(`Invalidated theme cache key: ${fullCacheKey}`);
    }
  } catch (cacheError) {
    console.warn("Failed to invalidate theme cache:", cacheError);
    // Don't throw - cache invalidation failure shouldn't break the theme update
  }
};

export interface ThemeUpdatePermissionResult {
  hasAccess: boolean;
  isGlobalTheme: boolean;
  theme: {
    id: number;
    type: $Enums.ThemeType;
    funnel: {
      id: number;
      name: string;
      workspaceId: number;
      createdBy: number;
    } | null;
  };
  workspace: {
    id: number;
    name: string;
    ownerId: number;
  } | null;
}

export const checkThemeUpdatePermissions = async (
  userId: number,
  themeId: number
): Promise<ThemeUpdatePermissionResult> => {
  const prisma = getPrisma();

  // Get theme with funnel, workspace, and type details
  const theme = await prisma.theme.findUnique({
    where: { id: themeId },
    select: {
      id: true,
      type: true,
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

  // Check if it's a global theme
  const isGlobalTheme = theme.type === $Enums.ThemeType.GLOBAL;

  if (isGlobalTheme) {
    // Global themes can only be updated by system admins
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      throw new ForbiddenError("Only system administrators can update global themes");
    }

    return {
      hasAccess: true,
      isGlobalTheme: true,
      theme: {
        id: theme.id,
        type: theme.type,
        funnel: null,
      },
      workspace: null,
    };
  }

  // For custom themes, check funnel and workspace
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
    isGlobalTheme: false,
    theme: {
      id: theme.id,
      type: theme.type,
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