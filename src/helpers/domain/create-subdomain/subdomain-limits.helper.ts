import { getPrisma } from "../../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../../errors/http-errors";
import { DomainType } from "../../../generated/prisma-client";

export const checkWorkspaceSubdomainLimits = async (
  workspaceId: number
): Promise<void> => {
  const prisma = getPrisma();

  // Fixed workspace limit of 3 subdomains
  const WORKSPACE_SUBDOMAIN_LIMIT = 3;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
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

  if (currentSubdomainCount >= WORKSPACE_SUBDOMAIN_LIMIT) {
    throw new BadRequestError(
      `This workspace has reached its maximum limit of ${WORKSPACE_SUBDOMAIN_LIMIT} subdomains.`
    );
  }
};
