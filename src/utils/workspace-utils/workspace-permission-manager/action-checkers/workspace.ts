import { WorkspaceRole, WorkspacePermission } from "../../../../generated/prisma-client";
import { PermissionAction } from "../types";
import { OwnerCapabilities, AdminCapabilities, EditorCapabilities, ViewerCapabilities } from "../role-capabilities";

/**
 * Workspace Action Checkers
 *
 * Handles permission checks for workspace-level operations:
 * - Settings management
 * - Allocation management
 * - Workspace deletion
 * - Workspace viewing/updating
 */

export class WorkspaceActionChecker {
  /**
   * Check if user can perform a workspace action
   */
  static canPerformAction(
    action: PermissionAction,
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (action) {
      case PermissionAction.MANAGE_WORKSPACE_SETTINGS:
      case PermissionAction.UPDATE_WORKSPACE:
        return this.canManageSettings(role, permissions);

      case PermissionAction.MANAGE_WORKSPACE_ALLOCATIONS:
        return this.canManageAllocations(role, permissions);

      case PermissionAction.DELETE_WORKSPACE:
        return this.canDeleteWorkspace(role);

      case PermissionAction.VIEW_WORKSPACE:
        return this.canViewWorkspace(role);

      default:
        return false;
    }
  }

  /**
   * Check if user can manage workspace settings
   */
  private static canManageSettings(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
        return true;

      case WorkspaceRole.ADMIN:
        // Admins need MANAGE_WORKSPACE permission
        return permissions.includes(WorkspacePermission.MANAGE_WORKSPACE);

      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        // Editors and viewers need MANAGE_WORKSPACE permission (rare)
        return permissions.includes(WorkspacePermission.MANAGE_WORKSPACE);

      default:
        return false;
    }
  }

  /**
   * Check if user can manage workspace allocations (funnels, domains, members limits)
   */
  private static canManageAllocations(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
        return OwnerCapabilities.canManageAllocations();

      case WorkspaceRole.ADMIN:
        return AdminCapabilities.canManageAllocations(permissions);

      case WorkspaceRole.EDITOR:
        return EditorCapabilities.canManageAllocations(permissions);

      case WorkspaceRole.VIEWER:
        return ViewerCapabilities.canManageAllocations(permissions);

      default:
        return false;
    }
  }

  /**
   * Check if user can delete workspace
   */
  private static canDeleteWorkspace(role: WorkspaceRole): boolean {
    // Only workspace owner can delete the workspace
    return role === WorkspaceRole.OWNER;
  }

  /**
   * Check if user can view workspace
   */
  private static canViewWorkspace(role: WorkspaceRole): boolean {
    // All workspace members can view the workspace
    return true;
  }
}
