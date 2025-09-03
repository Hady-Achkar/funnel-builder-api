import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../../errors";
import { $Enums } from "../../../generated/prisma-client";

interface ReorderPermissionResult {
  funnelId: number;
  workspaceId: number;
  existingPages: Array<{ id: number; order: number }>;
}

export const checkReorderPermissions = async (
  userId: number,
  funnelId: number
): Promise<ReorderPermissionResult> => {
  const prisma = getPrisma();

  // Get funnel with workspace info and existing pages
  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId },
    include: {
      workspace: true,
      pages: {
        select: { id: true, order: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!funnel) {
    throw new NotFoundError("Funnel not found");
  }

  if (funnel.pages.length === 0) {
    throw new NotFoundError("No pages found in this funnel");
  }

  // Check if user is the workspace owner
  const isOwner = funnel.workspace.ownerId === userId;
  let hasPermission = isOwner;

  if (!isOwner) {
    // Check workspace member role and permissions
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: funnel.workspaceId,
        },
      },
      select: {
        role: true,
        permissions: true,
      },
    });

    if (!member) {
      throw new ForbiddenError("You don't have access to this funnel");
    }

    // Check if user has permission to edit pages
    hasPermission =
      member.role === $Enums.WorkspaceRole.OWNER ||
      member.role === $Enums.WorkspaceRole.ADMIN ||
      member.permissions.includes($Enums.WorkspacePermission.EDIT_FUNNELS) ||
      member.permissions.includes($Enums.WorkspacePermission.EDIT_PAGES);
  }

  if (!hasPermission) {
    throw new ForbiddenError("You don't have permission to reorder pages in this funnel");
  }

  return {
    funnelId: funnel.id,
    workspaceId: funnel.workspaceId,
    existingPages: funnel.pages,
  };
};