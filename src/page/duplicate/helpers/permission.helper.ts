import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../../errors";
import { $Enums } from "../../../generated/prisma-client";

interface PageInfo {
  id: number;
  name: string;
  content: string;
  order: number;
  linkingId: string;
  funnelId: number;
  workspaceId: number;
}

interface TargetFunnelInfo {
  id: number;
  workspaceId: number;
}

export const checkDuplicatePermissions = async (
  userId: number,
  pageId: number,
  targetFunnelId?: number
): Promise<{
  sourcePage: PageInfo;
  targetFunnel: TargetFunnelInfo;
  isSameFunnel: boolean;
}> => {
  const prisma = getPrisma();

  // Get source page with funnel and workspace info
  const sourcePage = await prisma.page.findFirst({
    where: { id: pageId },
    include: {
      funnel: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!sourcePage) {
    throw new NotFoundError("Page not found");
  }

  // Check if user has access to the source page
  const isSourceOwner = sourcePage.funnel.workspace.ownerId === userId;
  let hasSourceAccess = isSourceOwner;

  if (!isSourceOwner) {
    const sourceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: sourcePage.funnel.workspaceId,
        },
      },
      select: {
        role: true,
        permissions: true,
      },
    });

    if (!sourceMember) {
      throw new ForbiddenError("You don't have access to this page");
    }

    // Need at least view access to duplicate from this page
    hasSourceAccess = true; // If member exists, they have at least view access
  }

  if (!hasSourceAccess) {
    throw new ForbiddenError("You don't have access to duplicate this page");
  }

  const isSameFunnel = !targetFunnelId || targetFunnelId === sourcePage.funnelId;
  let targetFunnel: TargetFunnelInfo;

  if (isSameFunnel) {
    // Duplicating within the same funnel
    targetFunnel = {
      id: sourcePage.funnelId,
      workspaceId: sourcePage.funnel.workspaceId,
    };

    // Check if user has edit permissions in the source funnel
    if (!isSourceOwner) {
      const member = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: sourcePage.funnel.workspaceId,
          },
        },
        select: {
          role: true,
          permissions: true,
        },
      });

      const hasEditPermission =
        member &&
        (member.role === $Enums.WorkspaceRole.OWNER ||
          member.role === $Enums.WorkspaceRole.ADMIN ||
          member.permissions.includes($Enums.WorkspacePermission.EDIT_FUNNELS) ||
          member.permissions.includes($Enums.WorkspacePermission.EDIT_PAGES));

      if (!hasEditPermission) {
        throw new ForbiddenError(
          "You don't have permission to create pages in this funnel"
        );
      }
    }
  } else {
    // Duplicating to a different funnel
    const targetFunnelData = await prisma.funnel.findUnique({
      where: { id: targetFunnelId },
      include: {
        workspace: true,
      },
    });

    if (!targetFunnelData) {
      throw new NotFoundError("Target funnel not found");
    }

    targetFunnel = {
      id: targetFunnelData.id,
      workspaceId: targetFunnelData.workspaceId,
    };

    // Check if user has edit permissions in the target funnel
    const isTargetOwner = targetFunnelData.workspace.ownerId === userId;

    if (!isTargetOwner) {
      const targetMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: targetFunnelData.workspaceId,
          },
        },
        select: {
          role: true,
          permissions: true,
        },
      });

      if (!targetMember) {
        throw new ForbiddenError(
          "You don't have access to the target funnel"
        );
      }

      const hasEditPermission =
        targetMember.role === $Enums.WorkspaceRole.OWNER ||
        targetMember.role === $Enums.WorkspaceRole.ADMIN ||
        targetMember.permissions.includes($Enums.WorkspacePermission.EDIT_FUNNELS) ||
        targetMember.permissions.includes($Enums.WorkspacePermission.EDIT_PAGES);

      if (!hasEditPermission) {
        throw new ForbiddenError(
          "You don't have permission to create pages in the target funnel"
        );
      }
    }
  }

  return {
    sourcePage: {
      id: sourcePage.id,
      name: sourcePage.name,
      content: sourcePage.content,
      order: sourcePage.order,
      linkingId: sourcePage.linkingId,
      funnelId: sourcePage.funnelId,
      workspaceId: sourcePage.funnel.workspaceId,
    },
    targetFunnel,
    isSameFunnel,
  };
};