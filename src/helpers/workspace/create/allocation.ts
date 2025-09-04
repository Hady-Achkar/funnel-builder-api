import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors/http-errors";

/**
 * Gets the user's remaining allocation budget
 */
export async function getUserRemainingAllocations(userId: number) {
  const prisma = getPrisma();

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

  return {
    totalLimits: {
      funnels: user.maximumFunnels,
      customDomains: user.maximumCustomDomains,
      subdomains: user.maximumSubdomains,
    },
    currentAllocations: {
      funnels: allocatedFunnels,
      customDomains: allocatedCustomDomains,
      subdomains: allocatedSubdomains,
    },
    remainingAllocations: {
      funnels: user.maximumFunnels - allocatedFunnels,
      customDomains: user.maximumCustomDomains - allocatedCustomDomains,
      subdomains: user.maximumSubdomains - allocatedSubdomains,
    },
  };
}

/**
 * Validates that the requested allocations are within reasonable bounds
 */
export function validateAllocationAmounts(allocations: {
  allocatedFunnels: number;
  allocatedCustomDomains: number;
  allocatedSubdomains: number;
}): void {
  const { allocatedFunnels, allocatedCustomDomains, allocatedSubdomains } = allocations;

  // Ensure allocations are not negative
  if (allocatedFunnels < 0 || allocatedCustomDomains < 0 || allocatedSubdomains < 0) {
    throw new BadRequestError("Allocations cannot be negative values");
  }

  // Ensure at least one funnel is allocated if any other resources are allocated
  if ((allocatedCustomDomains > 0 || allocatedSubdomains > 0) && allocatedFunnels === 0) {
    throw new BadRequestError(
      "At least one funnel must be allocated when allocating domains or subdomains"
    );
  }

  // Reasonable upper bounds per workspace
  const MAX_FUNNELS_PER_WORKSPACE = 500;
  const MAX_DOMAINS_PER_WORKSPACE = 50;

  if (allocatedFunnels > MAX_FUNNELS_PER_WORKSPACE) {
    throw new BadRequestError(
      `Maximum ${MAX_FUNNELS_PER_WORKSPACE} funnels can be allocated to a single workspace`
    );
  }

  if (allocatedCustomDomains > MAX_DOMAINS_PER_WORKSPACE) {
    throw new BadRequestError(
      `Maximum ${MAX_DOMAINS_PER_WORKSPACE} custom domains can be allocated to a single workspace`
    );
  }

  if (allocatedSubdomains > MAX_DOMAINS_PER_WORKSPACE) {
    throw new BadRequestError(
      `Maximum ${MAX_DOMAINS_PER_WORKSPACE} subdomains can be allocated to a single workspace`
    );
  }
}

/**
 * Suggests default allocations based on user's total limits and existing workspaces
 */
export async function suggestDefaultAllocations(userId: number) {
  const allocations = await getUserRemainingAllocations(userId);
  const remaining = allocations.remainingAllocations;

  // Get count of existing workspaces to determine distribution strategy
  const prisma = getPrisma();
  const workspaceCount = await prisma.workspace.count({
    where: { ownerId: userId },
  });

  // If this is the first workspace, suggest larger allocations
  // Otherwise, suggest more conservative allocations
  if (workspaceCount === 0) {
    return {
      allocatedFunnels: Math.min(remaining.funnels, 10),
      allocatedCustomDomains: Math.min(remaining.customDomains, 2),
      allocatedSubdomains: Math.min(remaining.subdomains, 3),
    };
  } else {
    return {
      allocatedFunnels: Math.min(remaining.funnels, 5),
      allocatedCustomDomains: Math.min(remaining.customDomains, 1),
      allocatedSubdomains: Math.min(remaining.subdomains, 2),
    };
  }
}