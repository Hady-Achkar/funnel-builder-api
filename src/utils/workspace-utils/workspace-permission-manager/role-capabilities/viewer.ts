import { WorkspaceRole, WorkspacePermission } from "../../../../generated/prisma-client";
import { RoleChangeContext, PermissionChangeContext, PermissionAction, ACTION_PERMISSION_MAP } from "../types";

/**
 * Viewer Role Capabilities
 *
 * Viewers have read-only access by default and need explicit permissions for any actions.
 * This is the most restrictive role.
 *
 * Key Rules:
 * - Needs MANAGE_MEMBERS permission to modify roles/permissions (rare)
 * - Cannot modify admins or owner
 * - Can only promote/demote other editors and viewers (if has MANAGE_MEMBERS)
 * - Cannot promote to ADMIN or OWNER
 * - Needs explicit permissions for most actions
 */

export class ViewerCapabilities {
  /**
   * Check if viewer can modify a member's role
   */
  static canModifyRole(context: RoleChangeContext): boolean {
    // Viewer needs MANAGE_MEMBERS permission to modify roles
    if (
      !context.requesterPermissions.includes(
        WorkspacePermission.MANAGE_MEMBERS
      )
    ) {
      return false;
    }

    // Viewer cannot modify admins or owner
    if (
      context.targetRole === WorkspaceRole.ADMIN ||
      context.targetRole === WorkspaceRole.OWNER
    ) {
      return false;
    }

    // Viewer can only promote/demote other editors and viewers
    if (
      context.newRole === WorkspaceRole.EDITOR ||
      context.newRole === WorkspaceRole.VIEWER
    ) {
      return true;
    }

    // Viewer cannot promote to ADMIN or OWNER
    return false;
  }

  /**
   * Check if viewer can assign/remove permissions
   */
  static canAssignPermissions(context: PermissionChangeContext): boolean {
    // Viewer needs MANAGE_MEMBERS permission to assign permissions
    if (
      !context.requesterPermissions.includes(
        WorkspacePermission.MANAGE_MEMBERS
      )
    ) {
      return false;
    }

    // Viewer cannot assign permissions to admins or owner
    if (
      context.targetRole === WorkspaceRole.ADMIN ||
      context.targetRole === WorkspaceRole.OWNER
    ) {
      return false;
    }

    // Viewer can assign permissions to other editors and viewers
    return true;
  }

  /**
   * Check if viewer can manage workspace allocations
   */
  static canManageAllocations(permissions: WorkspacePermission[]): boolean {
    // Viewer can manage allocations only if they have MANAGE_WORKSPACE permission
    return permissions.includes(WorkspacePermission.MANAGE_WORKSPACE);
  }

  /**
   * Check if viewer can perform a specific action
   */
  static canPerformAction(
    action: PermissionAction,
    permissions: WorkspacePermission[]
  ): boolean {
    const requiredPermissions = ACTION_PERMISSION_MAP[action];

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // Actions without specific permission requirements
      // Viewers can view workspace, funnels, etc. by default
      const viewActions = [
        PermissionAction.VIEW_WORKSPACE,
        PermissionAction.VIEW_FUNNEL,
        PermissionAction.VIEW_PAGE,
        PermissionAction.VIEW_DOMAINS,
        PermissionAction.VIEW_THEMES,
        PermissionAction.VIEW_FORM,
        PermissionAction.VIEW_INSIGHT,
        PermissionAction.VIEW_MEMBERS,
        PermissionAction.LEAVE_WORKSPACE,
      ];

      return viewActions.includes(action);
    }

    // Check if viewer has the required permissions (must be explicitly granted)
    return requiredPermissions.some(perm => permissions.includes(perm));
  }

  /**
   * Get viewer's capabilities summary
   */
  static getCapabilities() {
    return {
      role: WorkspaceRole.VIEWER,
      description: "Read-only access with ability to view workspace content",
      canModifyRoles: "Only with MANAGE_MEMBERS permission (rare)",
      canModifyRolesFor: ["EDITOR", "VIEWER"],
      cannotModifyRoles: ["ADMIN", "OWNER"],
      canAssignPermissions: "Only with MANAGE_MEMBERS permission (rare)",
      canManageAllocations: "Only with MANAGE_WORKSPACE permission (rare)",
      canUpdateWorkspaceSettings: false,
      canDeleteWorkspace: false,
      restrictions: [
        "Needs MANAGE_MEMBERS permission to modify roles/permissions",
        "Cannot modify admins or owner",
        "Cannot promote users to admin or owner",
        "Needs explicit permissions for most actions",
      ],
      defaultPermissions: [
        WorkspacePermission.VIEW_ANALYTICS,
      ],
    };
  }
}
