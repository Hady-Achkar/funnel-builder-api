import { PrismaClient } from "../../../../generated/prisma-client";
import { WorkspacePayload } from "../../../../types/funnel/create";

export const validateWorkspace = async (
  prisma: PrismaClient,
  workspaceSlug: string
): Promise<WorkspacePayload> => {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });

  if (!workspace) {
    throw new Error("We couldn't find that workspace");
  }

  return workspace;
};
