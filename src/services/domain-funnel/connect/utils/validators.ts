import { getPrisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../../../errors/http-errors";

/**
 * Funnel data with workspace information
 */
export interface FunnelWithWorkspace {
  id: number;
  workspaceId: number;
  name: string;
}

/**
 * Domain data with workspace information
 */
export interface DomainWithWorkspace {
  id: number;
  workspaceId: number;
  hostname: string;
}

/**
 * Validate that a funnel exists and return it with workspace information
 *
 * @param funnelId - The ID of the funnel to validate
 * @returns Funnel with workspace information
 * @throws BadRequestError if funnel not found
 */
export async function validateFunnelExists(
  funnelId: number
): Promise<FunnelWithWorkspace> {
  const prisma = getPrisma();

  const funnel = await prisma.funnel.findUnique({
    where: { id: funnelId },
    select: {
      id: true,
      workspaceId: true,
      name: true,
    },
  });

  if (!funnel) {
    throw new BadRequestError("Funnel not found");
  }

  return funnel;
}

/**
 * Validate that a domain exists and return it with workspace information
 *
 * @param domainId - The ID of the domain to validate
 * @returns Domain with workspace information
 * @throws BadRequestError if domain not found
 */
export async function validateDomainExists(
  domainId: number
): Promise<DomainWithWorkspace> {
  const prisma = getPrisma();

  const domain = await prisma.domain.findUnique({
    where: { id: domainId },
    select: {
      id: true,
      workspaceId: true,
      hostname: true,
    },
  });

  if (!domain) {
    throw new BadRequestError("Domain not found");
  }

  return domain;
}

/**
 * Validate that funnel and domain belong to the same workspace
 *
 * @param funnel - Funnel with workspace information
 * @param domain - Domain with workspace information
 * @throws BadRequestError if they belong to different workspaces
 */
export function validateSameWorkspace(
  funnel: FunnelWithWorkspace,
  domain: DomainWithWorkspace
): void {
  if (funnel.workspaceId !== domain.workspaceId) {
    throw new BadRequestError(
      "Funnel and domain must belong to the same workspace"
    );
  }
}
