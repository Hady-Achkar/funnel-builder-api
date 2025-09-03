import { getPrisma } from "../../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../../errors/http-errors";
import { DomainType } from "../../../generated/prisma-client";

export const checkWorkspaceDomainLimits = async (
  workspaceId: number
): Promise<void> => {
  const prisma = getPrisma();

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      allocatedCustomDomains: true,
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

  if (currentCustomDomainCount >= workspace.allocatedCustomDomains) {
    throw new BadRequestError(
      "This workspace has reached its maximum number of custom domains."
    );
  }
};
