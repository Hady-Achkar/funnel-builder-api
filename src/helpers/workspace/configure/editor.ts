import { $Enums } from "../../../generated/prisma-client";
import { RoleChangeAttempt, PermissionChangeAttempt } from "../../../types/workspace/configure";

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