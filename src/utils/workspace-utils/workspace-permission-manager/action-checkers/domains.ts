import { WorkspaceRole, WorkspacePermission } from "../../../../generated/prisma-client";
import { PermissionAction } from "../types";

/**
 * Domain Action Checkers
 *
 * Handles permission checks for domain operations:
 * - Creating subdomains
 * - Creating custom domains
 * - Deleting domains
 * - Connecting/disconnecting domains
 * - Managing domains
 * - Verifying domains
 */

export class DomainActionChecker {
  /**
   * Check if user can perform a domain action
   */
  static canPerformAction(
    action: PermissionAction,
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (action) {
      case PermissionAction.CREATE_SUBDOMAIN:
      case PermissionAction.CREATE_CUSTOM_DOMAIN:
        return this.canCreateDomain(role, permissions);

      case PermissionAction.DELETE_DOMAIN:
        return this.canDeleteDomain(role, permissions);

      case PermissionAction.CONNECT_DOMAIN:
      case PermissionAction.DISCONNECT_DOMAIN:
        return this.canConnectDomain(role, permissions);

      case PermissionAction.MANAGE_DOMAIN:
      case PermissionAction.VERIFY_DOMAIN:
        return this.canManageDomain(role, permissions);

      case PermissionAction.VIEW_DOMAINS:
        return this.canViewDomains(role);

      default:
        return false;
    }
  }

  /**
   * Check if user can create domains (subdomain or custom)
   */
  private static canCreateDomain(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        return permissions.includes(WorkspacePermission.CREATE_DOMAINS);

      default:
        return false;
    }
  }

  /**
   * Check if user can delete domains
   */
  private static canDeleteDomain(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        return permissions.includes(WorkspacePermission.DELETE_DOMAINS);

      default:
        return false;
    }
  }

  /**
   * Check if user can connect/disconnect domains to funnels
   */
  private static canConnectDomain(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        return permissions.includes(WorkspacePermission.CONNECT_DOMAINS);

      default:
        return false;
    }
  }

  /**
   * Check if user can manage domains (settings, verification)
   */
  private static canManageDomain(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
      case WorkspaceRole.ADMIN:
        return true;

      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        return permissions.includes(WorkspacePermission.MANAGE_DOMAINS);

      default:
        return false;
    }
  }

  /**
   * Check if user can view domains
   */
  private static canViewDomains(role: WorkspaceRole): boolean {
    // All workspace members can view domains
    return true;
  }
}
