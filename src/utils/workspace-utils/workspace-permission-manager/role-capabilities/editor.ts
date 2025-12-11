import { WorkspaceRole, WorkspacePermission } from "../../../../generated/prisma-client";
import { RoleChangeContext, PermissionChangeContext, PermissionAction, ACTION_PERMISSION_MAP } from "../types";

/**
 * Editor Role Capabilities
 *
 * Editors are content managers with permissions focused on creating and editing content.
 * They need explicit permissions for administrative tasks.
 *
 * Key Rules:
 * - Needs MANAGE_MEMBERS permission to modify roles/permissions
 * - Cannot modify admins or owner
 * - Can only promote/demote other editors and viewers
 * - Cannot promote to ADMIN or OWNER
 * - Can manage allocations only with MANAGE_WORKSPACE permission
 */

export class EditorCapabilities {
  /**
   * Check if editor can modify a member's role
   */
  static canModifyRole(context: RoleChangeContext): boolean {
    // Editor needs MANAGE_MEMBERS permission to modify roles
    if (
      !context.requesterPermissions.includes(
        WorkspacePermission.MANAGE_MEMBERS
      )
    ) {
      return false;
    }

    // Editor cannot modify admins or owner
    if (
      context.targetRole === WorkspaceRole.ADMIN ||
      context.targetRole === WorkspaceRole.OWNER
    ) {
      return false;
    }

    // Editor can only promote/demote other editors and viewers
    if (
      context.newRole === WorkspaceRole.EDITOR ||
      context.newRole === WorkspaceRole.VIEWER
    ) {
      return true;
    }

    // Editor cannot promote to ADMIN or OWNER
    return false;
  }

  /**
   * Check if editor can assign/remove permissions
   */
  static canAssignPermissions(context: PermissionChangeContext): boolean {
    // Editor needs MANAGE_MEMBERS permission to assign permissions
    if (
      !context.requesterPermissions.includes(
        WorkspacePermission.MANAGE_MEMBERS
      )
    ) {
      return false;
    }

    // Editor cannot assign permissions to admins or owner
    if (
      context.targetRole === WorkspaceRole.ADMIN ||
      context.targetRole === WorkspaceRole.OWNER
    ) {
      return false;
    }

    // Editor can assign permissions to other editors and viewers
    return true;
  }

  /**
   * Check if editor can manage workspace allocations
   */
  static canManageAllocations(permissions: WorkspacePermission[]): boolean {
    // Editor can manage allocations only if they have MANAGE_WORKSPACE permission
    return permissions.includes(WorkspacePermission.MANAGE_WORKSPACE);
  }

  /**
   * Check if editor can perform a specific action
   */
  static canPerformAction(
    action: PermissionAction,
    permissions: WorkspacePermission[]
  ): boolean {
    const requiredPermissions = ACTION_PERMISSION_MAP[action];

    if (!requiredPermissions || requiredPermissions.length === 0) {
      // Actions without specific permission requirements
      // Editors can view workspace, funnels, etc. by default
      const viewActions = [
        PermissionAction.VIEW_WORKSPACE,
        PermissionAction.VIEW_FUNNEL,
        PermissionAction.VIEW_PAGE,
        PermissionAction.VIEW_DOMAINS,
        PermissionAction.VIEW_THEMES,
        PermissionAction.VIEW_FORM,
        PermissionAction.VIEW_INSIGHT,
        PermissionAction.VIEW_MEMBERS,
      ];

      return viewActions.includes(action);
    }

    // Check if editor has the required permissions
    return requiredPermissions.some(perm => permissions.includes(perm));
  }

  /**
   * Get editor's capabilities summary
   */
  static getCapabilities() {
    return {
      role: WorkspaceRole.EDITOR,
      description: "Content manager focused on creating and editing workspace content",
      canModifyRoles: "Only with MANAGE_MEMBERS permission",
      canModifyRolesFor: ["EDITOR", "VIEWER"],
      cannotModifyRoles: ["ADMIN", "OWNER"],
      canAssignPermissions: "Only with MANAGE_MEMBERS permission",
      canManageAllocations: "Only with MANAGE_WORKSPACE permission",
      canUpdateWorkspaceSettings: false,
      canDeleteWorkspace: false,
      restrictions: [
        "Needs MANAGE_MEMBERS permission to modify roles/permissions",
        "Cannot modify admins or owner",
        "Cannot promote users to admin or owner",
        "Needs MANAGE_WORKSPACE permission for allocations",
      ],
      defaultPermissions: [
        WorkspacePermission.CREATE_FUNNELS,
        WorkspacePermission.EDIT_FUNNELS,
        WorkspacePermission.EDIT_PAGES,
        WorkspacePermission.VIEW_ANALYTICS,
      ],
    };
  }
}
