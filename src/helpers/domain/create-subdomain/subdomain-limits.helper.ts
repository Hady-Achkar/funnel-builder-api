import { getPrisma } from "../../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../../errors/http-errors";
import { DomainType } from "../../../generated/prisma-client";

export const checkWorkspaceSubdomainLimits = async (
  workspaceId: number
): Promise<void> => {
  const prisma = getPrisma();

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      allocatedSubdomains: true,
    },
  });

  if (!workspace) {
    throw new NotFoundError("Workspace not found");
  }

  const currentSubdomainCount = await prisma.domain.count({
    where: {
      workspaceId: workspaceId,
      type: DomainType.SUBDOMAIN,
    },
  });

  if (currentSubdomainCount >= workspace.allocatedSubdomains) {
    throw new BadRequestError(
      "This workspace has reached its maximum number of subdomains."
    );
  }
};
