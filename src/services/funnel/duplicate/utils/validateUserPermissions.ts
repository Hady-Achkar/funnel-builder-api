import { PrismaClient } from "../../../../generated/prisma-client";
import {
  hasPermissionToViewFunnel,
  hasPermissionToCreateFunnel,
} from "../../../../helpers/funnel/duplicate";

/**
 * Validates user permissions for funnel duplication
 *
 * Ensures the user has:
 * 1. VIEW_FUNNELS permission in the original funnel's workspace
 * 2. CREATE_FUNNELS permission in the target workspace (if different)
 *
 * Workspace owners automatically have all permissions.
 * Members need explicit VIEW_FUNNELS or CREATE_FUNNELS permissions.
 *
 * @param prisma - Prisma client instance
 * @param userId - ID of the user attempting to duplicate
 * @param originalFunnel - Original funnel with workspace details
 * @param targetWorkspaceId - ID of workspace where funnel will be duplicated to
 * @throws Error if user lacks view permission in original workspace
 * @throws Error if user lacks create permission in target workspace
 * @throws Error if user is not a member of either workspace
 */
export const validateUserPermissions = async (
  prisma: PrismaClient,
  userId: number,
  originalFunnel: {
    id: number;
    workspaceId: number;
    workspace: {
      id: number;
      name: string;
      ownerId: number;
    };
  },
  targetWorkspaceId: number
): Promise<void> => {
  // Check permission to view original funnel
  const isOriginalOwner = originalFunnel.workspace.ownerId === userId;

  if (!isOriginalOwner) {
    const originalMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userId,
          workspaceId: originalFunnel.workspaceId,
        },
      },
      select: {
        role: true,
        permissions: true,
      },
    });

    if (!originalMember) {
      throw new Error(
        `You don't have access to the original funnel. Please ask the workspace owner to invite you.`
      );
    }

    const canViewOriginal = hasPermissionToViewFunnel(
      originalMember.role,
      originalMember.permissions
    );

    if (!canViewOriginal) {
      throw new Error(
        `You don't have permission to view the original funnel.`
      );
    }
  }

  // If duplicating to a different workspace, check target workspace permissions
  if (targetWorkspaceId !== originalFunnel.workspaceId) {
    const targetWorkspace = await prisma.workspace.findUnique({
      where: { id: targetWorkspaceId },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

    if (!targetWorkspace) {
      throw new Error("Target workspace does not exist");
    }

    const isTargetOwner = targetWorkspace.ownerId === userId;

    if (!isTargetOwner) {
      const targetMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: userId,
            workspaceId: targetWorkspaceId,
          },
        },
        select: {
          role: true,
          permissions: true,
        },
      });

      if (!targetMember) {
        throw new Error(
          `You don't have access to the target workspace ${targetWorkspace.name}. Please ask the workspace owner to invite you.`
        );
      }

      const canCreateInTarget = hasPermissionToCreateFunnel(
        targetMember.role,
        targetMember.permissions
      );

      if (!canCreateInTarget) {
        throw new Error(
          `You don't have permission to create funnels in the target workspace ${targetWorkspace.name}.`
        );
      }
    }
  }
};