import { $Enums } from "../../../generated/prisma-client";
import { RoleChangeAttempt, PermissionChangeAttempt } from "../../../types/workspace/configure";
import { getPrisma } from "../../../lib/prisma";
import { NotFoundError } from "../../../errors/http-errors";

// Owner Helper Functions
export const ownerCanModifyRole = (attempt: RoleChangeAttempt): boolean => {
  // Owner cannot promote anyone else to OWNER (there can only be one owner)
  if (attempt.newRole === $Enums.WorkspaceRole.OWNER) {
    return false; // Cannot promote others to owner
  }
  
  // Owner cannot demote themselves from owner
  if (
    attempt.requesterId === attempt.targetMemberId &&
    attempt.targetRole === $Enums.WorkspaceRole.OWNER
  ) {
    return false; // Cannot demote self from owner
  }
  
  return true; // Owner can modify other roles (ADMIN, EDITOR, VIEWER)
};

export const ownerCanAssignPermissions = (
  _attempt: PermissionChangeAttempt
): boolean => {
  // Owner can assign/remove any permissions to/from any role
  return true;
};

export const ownerCanManageAllocations = (): boolean => {
  // Owner can always manage workspace allocations
  return true;
};

export const getOwnerCapabilities = () => ({
  canModifyAnyRole: "Except cannot promote others to OWNER",
  canAssignAnyPermission: true,
  canManageAllocations: true,
  canUpdateWorkspaceSettings: true,
  restrictions: [
    "Cannot demote self from owner role",
    "Cannot promote others to owner (only one owner per workspace)"
  ],
});

// Admin Helper Functions
export const adminCanModifyRole = (attempt: RoleChangeAttempt): boolean => {
  // Admin cannot modify other admins or owner
  if (
    attempt.targetRole === $Enums.WorkspaceRole.ADMIN ||
    attempt.targetRole === $Enums.WorkspaceRole.OWNER
  ) {
    return false;
  }

  // Admin can promote/demote only EDITOR and VIEWER roles
  if (
    attempt.newRole === $Enums.WorkspaceRole.EDITOR ||
    attempt.newRole === $Enums.WorkspaceRole.VIEWER
  ) {
    return true;
  }

  // Admin cannot promote to ADMIN or OWNER
  return false;
};

export const adminCanAssignPermissions = (
  attempt: PermissionChangeAttempt
): boolean => {
  // Admin cannot assign permissions to other admins or owner
  if (
    attempt.targetRole === $Enums.WorkspaceRole.ADMIN ||
    attempt.targetRole === $Enums.WorkspaceRole.OWNER
  ) {
    return false;
  }

  // Admin can assign permissions to EDITOR and VIEWER roles
  return true;
};

export const adminCanManageAllocations = (
  permissions: $Enums.WorkspacePermission[]
): boolean => {
  // Admin can manage allocations if they have MANAGE_WORKSPACE permission
  return permissions.includes($Enums.WorkspacePermission.MANAGE_WORKSPACE);
};

export const getAdminCapabilities = () => ({
  canModifyRoles: ["EDITOR", "VIEWER"],
  cannotModifyRoles: ["ADMIN", "OWNER"],
  canAssignPermissionsTo: ["EDITOR", "VIEWER"],
  canManageAllocations: "Only with MANAGE_WORKSPACE permission",
  canUpdateWorkspaceSettings: false,
  restrictions: [
    "Cannot modify other admins or owner",
    "Cannot promote users to admin or owner",
    "Need MANAGE_WORKSPACE permission for allocations",
  ],
});

// Editor Helper Functions
export const editorCanModifyRole = (attempt: RoleChangeAttempt): boolean => {
  // Editor needs MANAGE_MEMBERS permission to modify roles
  if (
    !attempt.requesterPermissions.includes(
      $Enums.WorkspacePermission.MANAGE_MEMBERS
    )
  ) {
    return false;
  }

  // Editor cannot modify admins or owner
  if (
    attempt.targetRole === $Enums.WorkspaceRole.ADMIN ||
    attempt.targetRole === $Enums.WorkspaceRole.OWNER
  ) {
    return false;
  }

  // Editor can only promote/demote other editors and viewers
  if (
    attempt.newRole === $Enums.WorkspaceRole.EDITOR ||
    attempt.newRole === $Enums.WorkspaceRole.VIEWER
  ) {
    return true;
  }

  // Editor cannot promote to ADMIN or OWNER
  return false;
};

export const editorCanAssignPermissions = (
  attempt: PermissionChangeAttempt
): boolean => {
  // Editor needs MANAGE_MEMBERS permission to assign permissions
  if (
    !attempt.requesterPermissions.includes(
      $Enums.WorkspacePermission.MANAGE_MEMBERS
    )
  ) {
    return false;
  }

  // Editor cannot assign permissions to admins or owner
  if (
    attempt.targetRole === $Enums.WorkspaceRole.ADMIN ||
    attempt.targetRole === $Enums.WorkspaceRole.OWNER
  ) {
    return false;
  }

  // Editor can assign permissions to other editors and viewers
  return true;
};

export const editorCanManageAllocations = (
  permissions: $Enums.WorkspacePermission[]
): boolean => {
  // Editor can manage allocations only if they have MANAGE_WORKSPACE permission
  return permissions.includes($Enums.WorkspacePermission.MANAGE_WORKSPACE);
};

export const getEditorCapabilities = () => ({
  canModifyRoles: "Only with MANAGE_MEMBERS permission",
  canModifyRolesFor: ["EDITOR", "VIEWER"],
  cannotModifyRoles: ["ADMIN", "OWNER"],
  canAssignPermissions: "Only with MANAGE_MEMBERS permission",
  canManageAllocations: "Only with MANAGE_WORKSPACE permission",
  canUpdateWorkspaceSettings: false,
  restrictions: [
    "Needs MANAGE_MEMBERS permission to modify roles/permissions",
    "Cannot modify admins or owner",
    "Cannot promote users to admin or owner",
    "Needs MANAGE_WORKSPACE permission for allocations",
  ],
});

// Viewer Helper Functions
export const viewerCanModifyRole = (attempt: RoleChangeAttempt): boolean => {
  // Viewer needs MANAGE_MEMBERS permission to modify roles
  if (
    !attempt.requesterPermissions.includes(
      $Enums.WorkspacePermission.MANAGE_MEMBERS
    )
  ) {
    return false;
  }

  // Viewer cannot modify admins or owner
  if (
    attempt.targetRole === $Enums.WorkspaceRole.ADMIN ||
    attempt.targetRole === $Enums.WorkspaceRole.OWNER
  ) {
    return false;
  }

  // Viewer can only promote/demote other editors and viewers
  if (
    attempt.newRole === $Enums.WorkspaceRole.EDITOR ||
    attempt.newRole === $Enums.WorkspaceRole.VIEWER
  ) {
    return true;
  }

  // Viewer cannot promote to ADMIN or OWNER
  return false;
};

export const viewerCanAssignPermissions = (
  attempt: PermissionChangeAttempt
): boolean => {
  // Viewer needs MANAGE_MEMBERS permission to assign permissions
  if (
    !attempt.requesterPermissions.includes(
      $Enums.WorkspacePermission.MANAGE_MEMBERS
    )
  ) {
    return false;
  }

  // Viewer cannot assign permissions to admins or owner
  if (
    attempt.targetRole === $Enums.WorkspaceRole.ADMIN ||
    attempt.targetRole === $Enums.WorkspaceRole.OWNER
  ) {
    return false;
  }

  // Viewer can assign permissions to other editors and viewers
  return true;
};

export const viewerCanManageAllocations = (
  permissions: $Enums.WorkspacePermission[]
): boolean => {
  // Viewer can manage allocations only if they have MANAGE_WORKSPACE permission
  return permissions.includes($Enums.WorkspacePermission.MANAGE_WORKSPACE);
};

export const getViewerCapabilities = () => ({
  canModifyRoles: "Only with MANAGE_MEMBERS permission",
  canModifyRolesFor: ["EDITOR", "VIEWER"],
  cannotModifyRoles: ["ADMIN", "OWNER"],
  canAssignPermissions: "Only with MANAGE_MEMBERS permission",
  canManageAllocations: "Only with MANAGE_WORKSPACE permission",
  canUpdateWorkspaceSettings: false,
  restrictions: [
    "Needs MANAGE_MEMBERS permission to modify roles/permissions",
    "Cannot modify admins or owner",
    "Cannot promote users to admin or owner",
    "Needs MANAGE_WORKSPACE permission for allocations",
  ],
});

// Permission Helper Functions
export const canUserModifyRole = (attempt: RoleChangeAttempt): boolean => {
  switch (attempt.requesterRole) {
    case $Enums.WorkspaceRole.OWNER:
      return ownerCanModifyRole(attempt);
    case $Enums.WorkspaceRole.ADMIN:
      return adminCanModifyRole(attempt);
    case $Enums.WorkspaceRole.EDITOR:
      return editorCanModifyRole(attempt);
    case $Enums.WorkspaceRole.VIEWER:
      return viewerCanModifyRole(attempt);
    default:
      return false;
  }
};

export const canUserAssignPermissions = (
  attempt: PermissionChangeAttempt
): boolean => {
  switch (attempt.requesterRole) {
    case $Enums.WorkspaceRole.OWNER:
      return ownerCanAssignPermissions(attempt);
    case $Enums.WorkspaceRole.ADMIN:
      return adminCanAssignPermissions(attempt);
    case $Enums.WorkspaceRole.EDITOR:
      return editorCanAssignPermissions(attempt);
    case $Enums.WorkspaceRole.VIEWER:
      return viewerCanAssignPermissions(attempt);
    default:
      return false;
  }
};

export const canUserManageAllocations = (
  role: $Enums.WorkspaceRole,
  permissions: $Enums.WorkspacePermission[]
): boolean => {
  switch (role) {
    case $Enums.WorkspaceRole.OWNER:
      return ownerCanManageAllocations();
    case $Enums.WorkspaceRole.ADMIN:
      return adminCanManageAllocations(permissions);
    case $Enums.WorkspaceRole.EDITOR:
      return editorCanManageAllocations(permissions);
    case $Enums.WorkspaceRole.VIEWER:
      return viewerCanManageAllocations(permissions);
    default:
      return false;
  }
};

export const validateRoleHierarchy = (
  currentRole: $Enums.WorkspaceRole,
  targetRole: $Enums.WorkspaceRole,
  newRole: $Enums.WorkspaceRole
): string | null => {
  // Owner trying to promote someone else to owner
  if (
    currentRole === $Enums.WorkspaceRole.OWNER &&
    newRole === $Enums.WorkspaceRole.OWNER &&
    targetRole !== $Enums.WorkspaceRole.OWNER
  ) {
    return "Cannot promote users to owner role. Each workspace can only have one owner";
  }

  // Owner trying to demote themselves
  if (
    currentRole === $Enums.WorkspaceRole.OWNER &&
    targetRole === $Enums.WorkspaceRole.OWNER &&
    newRole !== $Enums.WorkspaceRole.OWNER
  ) {
    return "Owner cannot demote themselves from owner role";
  }

  // Non-owner trying to modify owner
  if (
    currentRole !== $Enums.WorkspaceRole.OWNER &&
    targetRole === $Enums.WorkspaceRole.OWNER
  ) {
    return "Only owner can modify owner role";
  }

  // Admin trying to modify another admin
  if (
    currentRole === $Enums.WorkspaceRole.ADMIN &&
    targetRole === $Enums.WorkspaceRole.ADMIN
  ) {
    return "Admin cannot modify another admin";
  }

  // Non-owner trying to promote to admin or owner
  if (
    currentRole !== $Enums.WorkspaceRole.OWNER &&
    (newRole === $Enums.WorkspaceRole.ADMIN ||
      newRole === $Enums.WorkspaceRole.OWNER)
  ) {
    return "Only owner can promote users to admin";
  }

  return null; // Valid hierarchy
};

export const getPermissionError = (
  requesterRole: $Enums.WorkspaceRole,
  requesterPermissions: $Enums.WorkspacePermission[],
  action: "role" | "permissions" | "allocations"
): string => {
  const roleStr = requesterRole.toLowerCase();

  switch (action) {
    case "role":
      if (
        requesterRole === $Enums.WorkspaceRole.EDITOR ||
        requesterRole === $Enums.WorkspaceRole.VIEWER
      ) {
        if (
          !requesterPermissions.includes(
            $Enums.WorkspacePermission.MANAGE_MEMBERS
          )
        ) {
          return `You don't have permission to change member roles. Contact an admin or owner to get member management access.`;
        }
      }
      return `You don't have permission to change member roles. Only owners and admins can modify roles.`;

    case "permissions":
      if (
        requesterRole === $Enums.WorkspaceRole.EDITOR ||
        requesterRole === $Enums.WorkspaceRole.VIEWER
      ) {
        if (
          !requesterPermissions.includes(
            $Enums.WorkspacePermission.MANAGE_MEMBERS
          )
        ) {
          return `You don't have permission to modify member permissions. Contact an admin or owner to get member management access.`;
        }
      }
      return `You don't have permission to modify member permissions. Only owners and admins can manage permissions.`;

    case "allocations":
      if (
        requesterRole !== $Enums.WorkspaceRole.OWNER &&
        !requesterPermissions.includes(
          $Enums.WorkspacePermission.MANAGE_WORKSPACE
        )
      ) {
        return `You don't have permission to manage resource allocations (funnels, domains, subdomains). Contact an admin or owner to get workspace management access.`;
      }
      return `You don't have permission to manage resource allocations. Only owners can manage workspace resources.`;

    default:
      return `You don't have permission to perform this action. Contact your workspace owner or admin for assistance.`;
  }
};

// Allocation Helper Functions
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