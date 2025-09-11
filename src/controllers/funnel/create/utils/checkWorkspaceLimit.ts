import { Workspace } from "../../../../generated/prisma-client";
import { getPrisma } from "../../../../lib/prisma";

export const canWorkspaceCreateFunnel = async (
  workspaceSlug: Pick<Workspace, "slug">["slug"]
): Promise<boolean> => {
  const prisma = getPrisma();

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: {
      allocatedFunnels: true,
      owner: {
        select: {
          maximumFunnels: true
        }
      },
      _count: {
        select: {
          funnels: true
        }
      }
    }
  });

  if (!workspace) {
    return false;
  }

  const currentFunnelCount = workspace._count.funnels;
  const maxAllowedFunnels = workspace.owner.maximumFunnels;

  return currentFunnelCount < maxAllowedFunnels;
};