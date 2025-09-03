import { $Enums } from "../../../generated/prisma-client";
import { RoleChangeAttempt, PermissionChangeAttempt } from "../../../types/workspace/configure";

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