import { WorkspaceRole, WorkspacePermission } from "../../../../generated/prisma-client";
import { PermissionAction } from "../types";

/**
 * Page Action Checkers
 *
 * Handles permission checks for page operations within funnels:
 * - Creating pages
 * - Viewing pages
 * - Editing pages
 * - Deleting pages
 * - Duplicating pages
 * - Reordering pages
 */

export class PageActionChecker {
  /**
   * Check if user can perform a page action
   */
  static canPerformAction(
    action: PermissionAction,
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (action) {
      case PermissionAction.CREATE_PAGE:
      case PermissionAction.EDIT_PAGE:
      case PermissionAction.DELETE_PAGE:
      case PermissionAction.DUPLICATE_PAGE:
      case PermissionAction.REORDER_PAGE:
        return this.canEditPages(role, permissions);

      case PermissionAction.VIEW_PAGE:
        return this.canViewPage(role);

      default:
        return false;
    }
  }

  /**
   * Check if user can edit pages (create, edit, delete, duplicate, reorder)
   */
  private static canEditPages(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        return permissions.includes(WorkspacePermission.EDIT_PAGES);

      default:
        return false;
    }
  }

  /**
   * Check if user can view pages
   */
  private static canViewPage(role: WorkspaceRole): boolean {
    // All workspace members can view pages
    return true;
  }
}
