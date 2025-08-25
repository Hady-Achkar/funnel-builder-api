import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../../errors";

export interface PermissionCheckResult {
  isAdmin: boolean;
  hasAccess: boolean;
  workspace: {
    id: number;
    name: string;
    ownerId: number;
  };
  funnel: {
    id: number;
    name: string;
    workspaceId: number;
    createdBy: number;
  };
}

export const checkTemplateCreationPermissions = async (
  userId: number,
  funnelId: number
): Promise<PermissionCheckResult> => {
  const prisma = getPrisma();

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      isAdmin: true 
    },
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Only admins can create templates
  if (!user.isAdmin) {
    throw new ForbiddenError("Only admin users can create templates");
  }

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

  // Check if user has access to the workspace
  const isWorkspaceOwner = funnel.workspace.ownerId === userId;
  
  let hasWorkspaceAccess = isWorkspaceOwner;
  
  if (!isWorkspaceOwner) {
    // Check if user is a member of the workspace
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

    if (workspaceMember) {
      hasWorkspaceAccess = true;
    }
  }

  if (!hasWorkspaceAccess) {
    throw new ForbiddenError(
      `You don't have access to the workspace "${funnel.workspace.name}" containing this funnel`
    );
  }

  return {
    isAdmin: user.isAdmin,
    hasAccess: hasWorkspaceAccess,
    workspace: funnel.workspace,
    funnel: {
      id: funnel.id,
      name: funnel.name,
      workspaceId: funnel.workspaceId,
      createdBy: funnel.createdBy,
    },
  };
};