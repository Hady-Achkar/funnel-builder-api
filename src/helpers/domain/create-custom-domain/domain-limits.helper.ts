import { getPrisma } from "../../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../../errors/http-errors";
import { DomainType } from "../../../generated/prisma-client";

export const checkWorkspaceDomainLimits = async (
  workspaceId: number
): Promise<void> => {
  const prisma = getPrisma();

  // Fixed workspace limit of 3 custom domains
  const WORKSPACE_CUSTOM_DOMAIN_LIMIT = 3;

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
    },
  });

  if (!workspace) {
    throw new NotFoundError("Workspace not found");
  }

  const currentCustomDomainCount = await prisma.domain.count({
    where: {
      workspaceId: workspaceId,
      type: DomainType.CUSTOM_DOMAIN,
    },
  });

  if (currentCustomDomainCount >= WORKSPACE_CUSTOM_DOMAIN_LIMIT) {
    throw new BadRequestError(
      `This workspace has reached its maximum limit of ${WORKSPACE_CUSTOM_DOMAIN_LIMIT} custom domains.`
    );
  }
};
