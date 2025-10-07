import { WorkspaceRole } from "../../../../generated/prisma-client";
import { RoleChangeContext, PermissionChangeContext, PermissionAction } from "../types";

/**
 * Owner Role Capabilities
 *
 * The workspace owner has the highest level of authority with nearly unlimited permissions.
 * There can only be ONE owner per workspace.
 *
 * Key Rules:
 * - Can modify any role except OWNER (cannot promote others to OWNER)
 * - Cannot demote themselves from OWNER
 * - Can assign/remove any permissions to/from any role
 * - Always has full access to manage allocations
 * - Can delete the workspace
 */

export class OwnerCapabilities {
  /**
   * Check if owner can modify a member's role
   */
  static canModifyRole(context: RoleChangeContext): boolean {
    // Owner cannot promote anyone else to OWNER (there can only be one owner)
    if (context.newRole === WorkspaceRole.OWNER) {
      return false; // Cannot promote others to owner
    }

    // Owner cannot demote themselves from owner
    if (
      context.requesterId === context.targetMemberId &&
      context.targetRole === WorkspaceRole.OWNER
    ) {
      return false; // Cannot demote self from owner
    }

    return true; // Owner can modify other roles (ADMIN, EDITOR, VIEWER)
  }

  /**
   * Check if owner can assign/remove permissions
   */
  static canAssignPermissions(_context: PermissionChangeContext): boolean {
    // Owner can assign/remove any permissions to/from any role
    return true;
  }

  /**
   * Check if owner can manage workspace allocations
   */
  static canManageAllocations(): boolean {
    // Owner can always manage workspace allocations
    return true;
  }

  /**
   * Check if owner can perform a specific action
   */
  static canPerformAction(action: PermissionAction): boolean {
    // Owner can perform ALL actions
    return true;
  }

  /**
   * Get owner's capabilities summary
   */
  static getCapabilities() {
    return {
      role: WorkspaceRole.OWNER,
      description: "Workspace owner with full administrative privileges",
      canModifyRoles: "All roles except OWNER",
      canAssignPermissions: "Any permissions to any role",
      canManageAllocations: true,
      canUpdateWorkspaceSettings: true,
      canDeleteWorkspace: true,
      restrictions: [
        "Cannot demote self from owner role",
        "Cannot promote others to owner (only one owner per workspace)",
        "Owner role can only be transferred, not assigned"
      ],
      allowedActions: "ALL",
    };
  }
}
