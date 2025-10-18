import { WorkspaceRole, WorkspacePermission } from "../../../../generated/prisma-client";
import { PermissionAction } from "../types";

/**
 * Form Action Checkers
 *
 * Handles permission checks for form operations:
 * - Creating forms
 * - Updating forms
 * - Deleting forms
 * - Viewing forms
 * - Configuring webhooks
 */

export class FormActionChecker {
  /**
   * Check if user can perform a form action
   */
  static canPerformAction(
    action: PermissionAction,
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (action) {
      case PermissionAction.CREATE_FORM:
        return this.canCreateForm(role, permissions);

      case PermissionAction.UPDATE_FORM:
        return this.canUpdateForm(role, permissions);

      case PermissionAction.DELETE_FORM:
        return this.canDeleteForm(role, permissions);

      case PermissionAction.VIEW_FORM:
        return this.canViewForm(role);

      case PermissionAction.CONFIGURE_FORM_WEBHOOK:
        return this.canConfigureWebhook(role, permissions);

      default:
        return false;
    }
  }

  /**
   * Check if user can create forms
   */
  private static canCreateForm(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
        // Editors can create forms if they can edit pages
        return permissions.includes(WorkspacePermission.EDIT_PAGES);

      case WorkspaceRole.VIEWER:
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if user can update forms
   */
  private static canUpdateForm(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    return this.canCreateForm(role, permissions);
  }

  /**
   * Check if user can delete forms
   */
  private static canDeleteForm(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
        // Editors can delete forms if they can delete funnels
        return permissions.includes(WorkspacePermission.DELETE_FUNNELS);

      case WorkspaceRole.VIEWER:
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if user can view forms
   */
  private static canViewForm(role: WorkspaceRole): boolean {
    // All workspace members can view forms
    return true;
  }

  /**
   * Check if user can configure form webhooks
   */
  private static canConfigureWebhook(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
        // Editors can configure webhooks if they can edit pages
        return permissions.includes(WorkspacePermission.EDIT_PAGES);

      case WorkspaceRole.VIEWER:
        return false;

      default:
        return false;
    }
  }
}
