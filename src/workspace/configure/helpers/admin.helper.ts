import { $Enums } from "../../../generated/prisma-client";
import { RoleChangeAttempt, PermissionChangeAttempt } from "../types";

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
