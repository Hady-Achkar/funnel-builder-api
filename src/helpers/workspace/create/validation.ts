import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors/http-errors";
import { WorkspaceAllocationValidation } from "../../../types/workspace/create";

/**
 * Validates that a workspace slug is available (both as workspace slug and subdomain)
 */
export async function validateSlugAvailability(slug: string): Promise<void> {
  const prisma = getPrisma();

  // Check if workspace slug already exists
  const existingWorkspace = await prisma.workspace.findUnique({
    where: { slug },
  });

  if (existingWorkspace) {
    throw new BadRequestError(
      "This workspace slug is already taken. Please choose another one."
    );
  }

  // Check if subdomain would conflict with existing domains
  const workspaceDomain = process.env.WORKSPACE_DOMAIN
  const potentialHostname = `${slug}.${workspaceDomain}`;
  
  const existingDomain = await prisma.domain.findUnique({
    where: { hostname: potentialHostname },
  });

  if (existingDomain) {
    throw new BadRequestError(
      "This slug would create a conflicting subdomain. Please choose another one."
    );
  }
}

/**
 * Validates that the workspace name is not already used by this user
 */
export async function validateWorkspaceNameUniqueness(
  userId: number,
  name: string
): Promise<void> {
  const prisma = getPrisma();

  const existingWorkspace = await prisma.workspace.findFirst({
    where: {
      ownerId: userId,
      name: name,
    },
  });

  if (existingWorkspace) {
    throw new BadRequestError(
      "You already have a workspace with this name. Please choose a different name."
    );
  }
}

/**
 * Validates that user has sufficient allocation budget remaining
 */
export async function validateUserAllocationBudget(
  validation: WorkspaceAllocationValidation
): Promise<void> {
  const prisma = getPrisma();

  const {
    userId,
    requestedFunnels,
    requestedCustomDomains,
    requestedSubdomains,
  } = validation;

  // Get user's total limits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      maximumFunnels: true,
      maximumCustomDomains: true,
      maximumSubdomains: true,
    },
  });

  if (!user) {
    throw new BadRequestError("User not found");
  }

  // Get currently allocated resources across all user's workspaces
  const currentAllocations = await prisma.workspace.aggregate({
    where: { ownerId: userId },
    _sum: {
      allocatedFunnels: true,
      allocatedCustomDomains: true,
      allocatedSubdomains: true,
    },
  });

  const allocatedFunnels = currentAllocations._sum.allocatedFunnels || 0;
  const allocatedCustomDomains = currentAllocations._sum.allocatedCustomDomains || 0;
  const allocatedSubdomains = currentAllocations._sum.allocatedSubdomains || 0;

  // Check if requested allocations would exceed user's limits
  if (allocatedFunnels + requestedFunnels > user.maximumFunnels) {
    throw new BadRequestError(
      `Insufficient funnel allocation. You have ${user.maximumFunnels - allocatedFunnels} funnels remaining of your ${user.maximumFunnels} total limit.`
    );
  }

  if (allocatedCustomDomains + requestedCustomDomains > user.maximumCustomDomains) {
    throw new BadRequestError(
      `Insufficient custom domain allocation. You have ${user.maximumCustomDomains - allocatedCustomDomains} custom domains remaining of your ${user.maximumCustomDomains} total limit.`
    );
  }

  if (allocatedSubdomains + requestedSubdomains > user.maximumSubdomains) {
    throw new BadRequestError(
      `Insufficient subdomain allocation. You have ${user.maximumSubdomains - allocatedSubdomains} subdomains remaining of your ${user.maximumSubdomains} total limit.`
    );
  }
}

/**
 * Validates slug format for workspace creation
 */
export function validateSlugFormat(slug: string): void {
  // Additional validation beyond Zod schema
  const reservedSlugs = [
    'api', 'www', 'admin', 'dashboard', 'app', 'mail', 'ftp', 'blog',
    'help', 'support', 'docs', 'status', 'cdn', 'assets', 'static',
    'images', 'img', 'css', 'js', 'fonts', 'media', 'files'
  ];

  if (reservedSlugs.includes(slug.toLowerCase())) {
    throw new BadRequestError(
      `The slug "${slug}" is reserved and cannot be used. Please choose a different slug.`
    );
  }
}