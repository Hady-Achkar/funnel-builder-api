import { $Enums } from "../../../generated/prisma-client";
import { RoleChangeAttempt, PermissionChangeAttempt } from "../types";
import {
  ownerCanModifyRole,
  ownerCanAssignPermissions,
  ownerCanManageAllocations,
} from "./owner.helper";
import {
  adminCanModifyRole,
  adminCanAssignPermissions,
  adminCanManageAllocations,
} from "./admin.helper";
import {
  editorCanModifyRole,
  editorCanAssignPermissions,
  editorCanManageAllocations,
} from "./editor.helper";
import {
  viewerCanModifyRole,
  viewerCanAssignPermissions,
  viewerCanManageAllocations,
} from "./viewer.helper";

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
