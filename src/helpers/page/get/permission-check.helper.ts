import { getPrisma } from "../../../lib/prisma";
import { ForbiddenError, NotFoundError } from "../../../errors";

export interface FunnelViewPermissionResult {
  hasAccess: boolean;
  page: {
    id: number;
    name: string;
    funnelId: number;
  };
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

export const checkFunnelViewPermissions = async (
  userId: number,
  pageId: number
): Promise<FunnelViewPermissionResult> => {
  const prisma = getPrisma();

  // Get page with funnel and workspace details
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      name: true,
      funnelId: true,
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

  if (!page) {
    throw new NotFoundError("Page not found");
  }

  if (!page.funnel) {
    throw new NotFoundError("Funnel not found for this page");
  }

  if (!page.funnel.workspace) {
    throw new NotFoundError("Workspace not found for this funnel");
  }

  const { funnel } = page;
  const { workspace } = funnel;

  // Check if user is workspace owner
  const isWorkspaceOwner = workspace.ownerId === userId;

  let hasAccess = isWorkspaceOwner;

  if (!isWorkspaceOwner) {
    // Check if user is a workspace member
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
      // Any workspace member can view pages (basic read access)
      hasAccess = true;
    }
  }

  if (!hasAccess) {
    throw new ForbiddenError(
      `You don't have permission to view pages in the funnel "${funnel.name}"`
    );
  }

  return {
    hasAccess,
    page: {
      id: page.id,
      name: page.name,
      funnelId: page.funnelId,
    },
    funnel: {
      id: funnel.id,
      name: funnel.name,
      workspaceId: funnel.workspaceId,
      createdBy: funnel.createdBy,
    },
    workspace,
  };
};