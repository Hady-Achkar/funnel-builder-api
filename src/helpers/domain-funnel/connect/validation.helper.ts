import { getPrisma } from "../../../lib/prisma";
import { NotFoundError, BadRequestError } from "../../../errors/http-errors";
import { $Enums } from "../../../generated/prisma-client";

export const validateFunnelExists = async (
  funnelId: number,
  workspaceId: number
) => {
  const funnel = await getPrisma().funnel.findFirst({
    where: {
      id: funnelId,
      workspaceId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      workspaceId: true,
    },
  });

  if (!funnel) {
    throw new NotFoundError(
      "Funnel not found or you don't have access to it"
    );
  }

  if (funnel.status !== $Enums.FunnelStatus.LIVE) {
    throw new BadRequestError(
      "Funnel must be LIVE before connecting to a domain"
    );
  }

  return funnel;
};

export const validateDomainExists = async (
  domainId: number,
  workspaceId: number
) => {
  const domain = await getPrisma().domain.findFirst({
    where: {
      id: domainId,
      workspaceId,
    },
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
    throw new NotFoundError(
      "Domain not found or you don't have access to it"
    );
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