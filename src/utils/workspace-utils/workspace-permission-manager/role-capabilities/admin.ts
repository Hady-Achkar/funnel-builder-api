import { WorkspaceRole, WorkspacePermission } from "../../../../generated/prisma-client";
import { RoleChangeContext, PermissionChangeContext, PermissionAction, ACTION_PERMISSION_MAP } from "../types";

/**
 * Admin Role Capabilities
 *
 * Admins have broad permissions similar to owners but with key restrictions.
 *
 * Key Rules:
 * - Cannot modify other admins or the owner
 * - Can promote/demote only EDITOR and VIEWER roles
 * - Cannot promote users to ADMIN or OWNER (only owner can)
 * - Can manage allocations if they have MANAGE_WORKSPACE permission
 * - Can assign permissions to EDITOR and VIEWER roles only
 */

export class AdminCapabilities {
  /**
   * Check if admin can modify a member's role
   */
  static canModifyRole(context: RoleChangeContext): boolean {
    // Admin cannot modify other admins or owner
    if (
      context.targetRole === WorkspaceRole.ADMIN ||
      context.targetRole === WorkspaceRole.OWNER
    ) {
      return false;
    }

    // Admin can promote/demote only EDITOR and VIEWER roles
    if (
      context.newRole === WorkspaceRole.EDITOR ||
      context.newRole === WorkspaceRole.VIEWER
    ) {
      return true;
    }

    // Admin cannot promote to ADMIN or OWNER
    return false;
  }

  /**
   * Check if admin can assign/remove permissions
   */
  static canAssignPermissions(context: PermissionChangeContext): boolean {
    // Admin cannot assign permissions to other admins or owner
    if (
      context.targetRole === WorkspaceRole.ADMIN ||
      context.targetRole === WorkspaceRole.OWNER
    ) {
      return false;
    }

    // Admin can assign permissions to EDITOR and VIEWER roles
    return true;
  }

  /**
   * Check if admin can manage workspace allocations
   */
  static canManageAllocations(permissions: WorkspacePermission[]): boolean {
    // Admin can manage allocations if they have MANAGE_WORKSPACE permission
    return permissions.includes(WorkspacePermission.MANAGE_WORKSPACE);
  }

  /**
   * Check if admin can perform a specific action
   */
  static canPerformAction(
    action: PermissionAction,
    permissions: WorkspacePermission[]
  ): boolean {
    // Admins have all base permissions by default
    const requiredPermissions = ACTION_PERMISSION_MAP[action];

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // If no specific permission is required, admin can do it
      return true;
    }

    // For actions requiring MANAGE_WORKSPACE, check if admin has it
    if (requiredPermissions.includes(WorkspacePermission.MANAGE_WORKSPACE)) {
      return permissions.includes(WorkspacePermission.MANAGE_WORKSPACE);
    }

    // Admins have all other permissions by default
    return true;
  }

  /**
   * Get admin's capabilities summary
   */
  static getCapabilities() {
    return {
      role: WorkspaceRole.ADMIN,
      description: "Administrator with broad permissions but cannot modify other admins or owner",
      canModifyRoles: ["EDITOR", "VIEWER"],
      cannotModifyRoles: ["ADMIN", "OWNER"],
      canAssignPermissionsTo: ["EDITOR", "VIEWER"],
      canManageAllocations: "Only with MANAGE_WORKSPACE permission",
      canUpdateWorkspaceSettings: false,
      canDeleteWorkspace: false,
      restrictions: [
        "Cannot modify other admins or owner",
        "Cannot promote users to admin or owner",
        "Need MANAGE_WORKSPACE permission for allocations",
      ],
      defaultPermissions: [
        "All permissions except MANAGE_WORKSPACE (unless explicitly granted)"
      ],
    };
  }
}
