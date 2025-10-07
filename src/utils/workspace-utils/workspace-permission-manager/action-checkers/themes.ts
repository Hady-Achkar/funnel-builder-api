import { WorkspaceRole, WorkspacePermission } from "../../../../generated/prisma-client";
import { PermissionAction } from "../types";

/**
 * Theme Action Checkers
 *
 * Handles permission checks for theme operations:
 * - Creating themes
 * - Updating themes
 * - Deleting themes
 * - Setting active theme
 * - Viewing themes
 */

export class ThemeActionChecker {
  /**
   * Check if user can perform a theme action
   */
  static canPerformAction(
    action: PermissionAction,
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (action) {
      case PermissionAction.CREATE_THEME:
        return this.canCreateTheme(role, permissions);

      case PermissionAction.UPDATE_THEME:
        return this.canUpdateTheme(role, permissions);

      case PermissionAction.DELETE_THEME:
        return this.canDeleteTheme(role, permissions);

      case PermissionAction.SET_ACTIVE_THEME:
        return this.canSetActiveTheme(role, permissions);

      case PermissionAction.VIEW_THEMES:
        return this.canViewThemes(role);

      default:
        return false;
    }
  }

  /**
   * Check if user can create themes
   */
  private static canCreateTheme(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
        // Editors can create themes if they can edit funnels
        return permissions.includes(WorkspacePermission.EDIT_FUNNELS);

      case WorkspaceRole.VIEWER:
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if user can update themes
   */
  private static canUpdateTheme(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
        // Editors can update themes if they can edit funnels
        return permissions.includes(WorkspacePermission.EDIT_FUNNELS);

      case WorkspaceRole.VIEWER:
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if user can delete themes
   */
  private static canDeleteTheme(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
        // Editors can delete themes if they can delete funnels
        return permissions.includes(WorkspacePermission.DELETE_FUNNELS);

      case WorkspaceRole.VIEWER:
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if user can set active theme for a funnel
   */
  private static canSetActiveTheme(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
        // Editors can set active theme if they can edit funnels
        return permissions.includes(WorkspacePermission.EDIT_FUNNELS);

      case WorkspaceRole.VIEWER:
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if user can view themes
   */
  private static canViewThemes(role: WorkspaceRole): boolean {
    // All workspace members can view themes
    return true;
  }
}
