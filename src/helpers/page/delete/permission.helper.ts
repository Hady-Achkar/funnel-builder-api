import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../../errors";
import { $Enums } from "../../../generated/prisma-client";

interface PermissionCheckResult {
  funnelId: number;
  workspaceId: number;
  pageOrder: number;
  pageName: string;
}

export const checkPageDeletePermission = async (
  userId: number,
  pageId: number
): Promise<PermissionCheckResult> => {
  const prisma = getPrisma();

  // Get page with funnel and workspace information
  const page = await prisma.page.findFirst({
    where: { id: pageId },
    include: {
      funnel: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!page) {
    throw new NotFoundError("Page not found");
  }

  // Check if user is the workspace owner
  const isOwner = page.funnel.workspace.ownerId === userId;
  
  let hasPermission = isOwner;

  if (!isOwner) {
    // Check workspace member role and permissions
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: page.funnel.workspaceId,
        },
      },
      select: {
        role: true,
        permissions: true,
      },
    });

    if (!member) {
      throw new ForbiddenError("You don't have access to this page");
    }

    // Check if user has permission to delete based on role and permissions
    hasPermission = 
      member.role === $Enums.WorkspaceRole.OWNER ||
      member.role === $Enums.WorkspaceRole.ADMIN ||
      member.permissions.includes($Enums.WorkspacePermission.DELETE_FUNNELS);
  }

  if (!hasPermission) {
    throw new ForbiddenError("You don't have permission to delete pages");
  }

  // Check if this is the last page in the funnel
  const pageCount = await prisma.page.count({
    where: { funnelId: page.funnelId },
  });

  if (pageCount <= 1) {
    throw new ForbiddenError("Cannot delete the last page in a funnel");
  }

  return {
    funnelId: page.funnelId,
    workspaceId: page.funnel.workspaceId,
    pageOrder: page.order,
    pageName: page.name,
  };
};