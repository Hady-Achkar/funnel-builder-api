import { getPrisma } from "../../../lib/prisma";
import { NotFoundError } from "../../../errors/http-errors";

export interface AllocationSummary {
  totalAllocatedFunnels: number;
  totalAllocatedCustomDomains: number;
  totalAllocatedSubdomains: number;
  remainingFunnels: number;
  remainingCustomDomains: number;
  remainingSubdomains: number;
  maxFunnels: number;
  maxCustomDomains: number;
  maxSubdomains: number;
}

export interface AllocationRequest {
  allocatedFunnels?: number;
  allocatedCustomDomains?: number;
  allocatedSubdomains?: number;
}

export const calculateOwnerAllocations = async (
  ownerId: number,
  currentWorkspaceId: number
): Promise<AllocationSummary> => {
  const prisma = getPrisma();

  // Get owner's limits
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: {
      maximumFunnels: true,
      maximumCustomDomains: true,
      maximumSubdomains: true,
    },
  });

  if (!owner) {
    throw new NotFoundError("Owner not found");
  }

  // Get all workspaces owned by this user (excluding current workspace)
  const workspaces = await prisma.workspace.findMany({
    where: {
      ownerId: ownerId,
      NOT: { id: currentWorkspaceId }, // Exclude current workspace to avoid double counting
    },
    select: {
      allocatedFunnels: true,
      allocatedCustomDomains: true,
      allocatedSubdomains: true,
    },
  });

  // Calculate total allocations across all other workspaces
  const totalAllocatedFunnels = workspaces.reduce(
    (sum, workspace) => sum + workspace.allocatedFunnels,
    0
  );
  const totalAllocatedCustomDomains = workspaces.reduce(
    (sum, workspace) => sum + workspace.allocatedCustomDomains,
    0
  );
  const totalAllocatedSubdomains = workspaces.reduce(
    (sum, workspace) => sum + workspace.allocatedSubdomains,
    0
  );

  return {
    totalAllocatedFunnels,
    totalAllocatedCustomDomains,
    totalAllocatedSubdomains,
    remainingFunnels: owner.maximumFunnels - totalAllocatedFunnels,
    remainingCustomDomains:
      owner.maximumCustomDomains - totalAllocatedCustomDomains,
    remainingSubdomains: owner.maximumSubdomains - totalAllocatedSubdomains,
    maxFunnels: owner.maximumFunnels,
    maxCustomDomains: owner.maximumCustomDomains,
    maxSubdomains: owner.maximumSubdomains,
  };
};

export const validateAllocationRequest = async (
  ownerId: number,
  currentWorkspaceId: number,
  newAllocations: AllocationRequest,
  currentAllocations: AllocationRequest
): Promise<string | null> => {
  const summary = await calculateOwnerAllocations(ownerId, currentWorkspaceId);

  // Check if the new allocations would exceed owner's limits
  const requestedFunnels =
    newAllocations.allocatedFunnels ?? currentAllocations.allocatedFunnels ?? 0;
  const requestedCustomDomains =
    newAllocations.allocatedCustomDomains ??
    currentAllocations.allocatedCustomDomains ??
    0;
  const requestedSubdomains =
    newAllocations.allocatedSubdomains ??
    currentAllocations.allocatedSubdomains ??
    0;

  if (summary.totalAllocatedFunnels + requestedFunnels > summary.maxFunnels) {
    const needed =
      summary.totalAllocatedFunnels + requestedFunnels - summary.maxFunnels;
    return `Cannot allocate ${requestedFunnels} funnels. Owner has ${summary.maxFunnels} total funnels, ${summary.totalAllocatedFunnels} already allocated to other workspaces (${needed} over limit)`;
  }

  if (
    summary.totalAllocatedCustomDomains + requestedCustomDomains >
    summary.maxCustomDomains
  ) {
    const needed =
      summary.totalAllocatedCustomDomains +
      requestedCustomDomains -
      summary.maxCustomDomains;
    return `Cannot allocate ${requestedCustomDomains} custom domains. Owner has ${summary.maxCustomDomains} total custom domains, ${summary.totalAllocatedCustomDomains} already allocated to other workspaces (${needed} over limit)`;
  }

  if (
    summary.totalAllocatedSubdomains + requestedSubdomains >
    summary.maxSubdomains
  ) {
    const needed =
      summary.totalAllocatedSubdomains +
      requestedSubdomains -
      summary.maxSubdomains;
    return `Cannot allocate ${requestedSubdomains} subdomains. Owner has ${summary.maxSubdomains} total subdomains, ${summary.totalAllocatedSubdomains} already allocated to other workspaces (${needed} over limit)`;
  }

  return null; // Validation passed
};

export const getAllocationSummaryMessage = async (
  ownerId: number,
  currentWorkspaceId: number
): Promise<string> => {
  const summary = await calculateOwnerAllocations(ownerId, currentWorkspaceId);

  return `Owner allocation summary: Funnels: ${summary.totalAllocatedFunnels}/${summary.maxFunnels} (${summary.remainingFunnels} remaining), Custom Domains: ${summary.totalAllocatedCustomDomains}/${summary.maxCustomDomains} (${summary.remainingCustomDomains} remaining), Subdomains: ${summary.totalAllocatedSubdomains}/${summary.maxSubdomains} (${summary.remainingSubdomains} remaining)`;
};