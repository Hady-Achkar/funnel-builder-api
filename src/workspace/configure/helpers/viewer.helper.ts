import { $Enums } from "../../../generated/prisma-client";
import { RoleChangeAttempt, PermissionChangeAttempt } from "../types";

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
