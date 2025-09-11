import { Funnel, Workspace } from "../../../../generated/prisma-client";
import { getPrisma } from "../../../../lib/prisma";

export const isFunnelNameAvailable = async (
  name: Pick<Funnel, "name">["name"],
  workspaceSlug: Pick<Workspace, "slug">["slug"]
): Promise<boolean> => {
  const invalidCharsRegex = /[^a-zA-Z0-9\s\-_]/;
  if (invalidCharsRegex.test(name)) {
    return false;
  }

  const prisma = getPrisma();

  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: { id: true },
  });

  if (!workspace) {
    return false;
  }

  const existingFunnel = await prisma.funnel.findFirst({
    where: {
      name,
      workspaceId: workspace.id,
    },
  });

  if (existingFunnel) {
    return false;
  }

  return true;
};
