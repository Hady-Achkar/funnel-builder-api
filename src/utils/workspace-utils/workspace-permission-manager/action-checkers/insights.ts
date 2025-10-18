import { WorkspaceRole, WorkspacePermission } from "../../../../generated/prisma-client";
import { PermissionAction } from "../types";

/**
 * Insight Action Checkers
 *
 * Handles permission checks for insight operations:
 * - Creating insights
 * - Updating insights
 * - Deleting insights
 * - Viewing insights
 * - Viewing insight submissions
 */

export class InsightActionChecker {
  /**
   * Check if user can perform an insight action
   */
  static canPerformAction(
    action: PermissionAction,
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (action) {
      case PermissionAction.CREATE_INSIGHT:
        return this.canCreateInsight(role, permissions);

      case PermissionAction.UPDATE_INSIGHT:
        return this.canUpdateInsight(role, permissions);

      case PermissionAction.DELETE_INSIGHT:
        return this.canDeleteInsight(role, permissions);

      case PermissionAction.VIEW_INSIGHT:
        return this.canViewInsight(role);

      case PermissionAction.VIEW_INSIGHT_SUBMISSIONS:
        return this.canViewSubmissions(role, permissions);

      default:
        return false;
    }
  }

  /**
   * Check if user can create insights
   */
  private static canCreateInsight(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
        // Editors can create insights if they can edit pages
        return permissions.includes(WorkspacePermission.EDIT_PAGES);

      case WorkspaceRole.VIEWER:
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if user can update insights
   */
  private static canUpdateInsight(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    return this.canCreateInsight(role, permissions);
  }

  /**
   * Check if user can delete insights
   */
  private static canDeleteInsight(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
        // Editors can delete insights if they can delete funnels
        return permissions.includes(WorkspacePermission.DELETE_FUNNELS);

      case WorkspaceRole.VIEWER:
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if user can view insights
   */
  private static canViewInsight(role: WorkspaceRole): boolean {
    // All workspace members can view insights
    return true;
  }

  /**
   * Check if user can view insight submissions
   */
  private static canViewSubmissions(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        // Need VIEW_ANALYTICS permission to view submissions
        return permissions.includes(WorkspacePermission.VIEW_ANALYTICS);

      default:
        return false;
    }
  }
}
