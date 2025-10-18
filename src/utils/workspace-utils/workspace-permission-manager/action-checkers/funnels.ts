import { WorkspaceRole, WorkspacePermission } from "../../../../generated/prisma-client";
import { PermissionAction } from "../types";

/**
 * Funnel Action Checkers
 *
 * Handles permission checks for funnel operations:
 * - Creating funnels
 * - Viewing funnels
 * - Editing funnels
 * - Deleting funnels
 * - Duplicating funnels
 * - Archiving/restoring funnels
 */

export class FunnelActionChecker {
  /**
   * Check if user can perform a funnel action
   */
  static canPerformAction(
    action: PermissionAction,
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (action) {
      case PermissionAction.CREATE_FUNNEL:
      case PermissionAction.DUPLICATE_FUNNEL:
        return this.canCreateFunnel(role, permissions);

      case PermissionAction.VIEW_FUNNEL:
        return this.canViewFunnel(role);

      case PermissionAction.EDIT_FUNNEL:
        return this.canEditFunnel(role, permissions);

      case PermissionAction.DELETE_FUNNEL:
        return this.canDeleteFunnel(role, permissions);

      case PermissionAction.ARCHIVE_FUNNEL:
      case PermissionAction.RESTORE_FUNNEL:
        return this.canArchiveFunnel(role, permissions);

      default:
        return false;
    }
  }

  /**
   * Check if user can create funnels
   */
  private static canCreateFunnel(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        return permissions.includes(WorkspacePermission.CREATE_FUNNELS);

      default:
        return false;
    }
  }

  /**
   * Check if user can view funnels
   */
  private static canViewFunnel(role: WorkspaceRole): boolean {
    // All workspace members can view funnels
    return true;
  }

  /**
   * Check if user can edit funnels
   */
  private static canEditFunnel(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        return permissions.includes(WorkspacePermission.EDIT_FUNNELS);

      default:
        return false;
    }
  }

  /**
   * Check if user can delete funnels
   */
  private static canDeleteFunnel(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        return permissions.includes(WorkspacePermission.DELETE_FUNNELS);

      default:
        return false;
    }
  }

  /**
   * Check if user can archive/restore funnels
   */
  private static canArchiveFunnel(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    // Same as delete permissions
    return this.canDeleteFunnel(role, permissions);
  }
}
