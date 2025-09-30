import { getPrisma } from "../../../lib/prisma";
import { NotFoundError, BadRequestError } from "../../../errors/http-errors";
import { $Enums } from "../../../generated/prisma-client";

export const validateFunnelExists = async (funnelId: number) => {
  const funnel = await getPrisma().funnel.findUnique({
    where: { id: funnelId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      workspaceId: true,
    },
  });

  if (!funnel) {
    throw new NotFoundError("Funnel not found");
  }

  return funnel;
};

export const validateDomainExists = async (domainId: number) => {
  const domain = await getPrisma().domain.findUnique({
    where: { id: domainId },
    select: {
      id: true,
      hostname: true,
      type: true,
      status: true,
      sslStatus: true,
      workspaceId: true,
    },
  });

  if (!domain) {
    throw new NotFoundError("Domain not found");
  }

  const isVerified = domain.status !== $Enums.DomainStatus.PENDING;
  if (!isVerified) {
    throw new BadRequestError(
      "Domain must be verified before connecting to a funnel"
    );
  }

  if (domain.status !== $Enums.DomainStatus.ACTIVE) {
    throw new BadRequestError(
      "Domain must be active before connecting to a funnel"
    );
  }

  return domain;
};

export const validateSameWorkspace = (
  funnel: { workspaceId: number },
  domain: { workspaceId: number }
) => {
  if (funnel.workspaceId !== domain.workspaceId) {
    throw new BadRequestError(
      "Funnel and domain must belong to the same workspace"
    );
  }
};