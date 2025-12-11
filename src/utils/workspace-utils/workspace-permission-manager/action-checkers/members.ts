import { WorkspaceRole, WorkspacePermission } from "../../../../generated/prisma-client";
import { PermissionAction, RoleChangeContext, PermissionChangeContext } from "../types";
import { OwnerCapabilities, AdminCapabilities, EditorCapabilities, ViewerCapabilities } from "../role-capabilities";

/**
 * Member Action Checkers
 *
 * Handles permission checks for member management operations:
 * - Inviting members
 * - Removing members
 * - Modifying member roles
 * - Modifying member permissions
 * - Viewing members
 */

export class MemberActionChecker {
  /**
   * Check if user can perform a member action
   */
  static canPerformAction(
    action: PermissionAction,
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (action) {
      case PermissionAction.INVITE_MEMBER:
        return this.canInviteMember(role, permissions);

      case PermissionAction.REMOVE_MEMBER:
        return this.canRemoveMember(role, permissions);

      case PermissionAction.VIEW_MEMBERS:
        return this.canViewMembers(role);

      case PermissionAction.LEAVE_WORKSPACE:
        return true; // All members can leave (except owner in some cases)

      // Role and permission modifications need context, handled separately
      case PermissionAction.MODIFY_MEMBER_ROLE:
      case PermissionAction.MODIFY_MEMBER_PERMISSIONS:
        return this.canModifyMembers(role, permissions);

      default:
        return false;
    }
  }

  /**
   * Check if user can invite members to workspace
   */
  private static canInviteMember(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
        return true;

      case WorkspaceRole.ADMIN:
        // Admins can invite members
        return true;

      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        // Editors and viewers need MANAGE_MEMBERS permission
        return permissions.includes(WorkspacePermission.MANAGE_MEMBERS);

      default:
        return false;
    }
  }

  /**
   * Check if user can remove members from workspace
   */
  private static canRemoveMember(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
        return true;

      case WorkspaceRole.ADMIN:
        // Admins can remove members (except other admins and owner)
        return true;

      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        // Editors and viewers need MANAGE_MEMBERS permission
        return permissions.includes(WorkspacePermission.MANAGE_MEMBERS);

      default:
        return false;
    }
  }

  /**
   * Check if user can modify members (roles/permissions)
   */
  private static canModifyMembers(
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (role) {
      case WorkspaceRole.OWNER:
        return true;

      case WorkspaceRole.ADMIN:
        return true; // Subject to hierarchy rules

      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        // Need MANAGE_MEMBERS permission
        return permissions.includes(WorkspacePermission.MANAGE_MEMBERS);

      default:
        return false;
    }
  }

  /**
   * Check if user can view workspace members
   */
  private static canViewMembers(role: WorkspaceRole): boolean {
    // All workspace members can view other members
    return true;
  }

  /**
   * Check if user can modify a specific member's role (with context)
   */
  static canModifyMemberRole(context: RoleChangeContext): boolean {
    switch (context.requesterRole) {
      case WorkspaceRole.OWNER:
        return OwnerCapabilities.canModifyRole(context);

      case WorkspaceRole.ADMIN:
        return AdminCapabilities.canModifyRole(context);

      case WorkspaceRole.EDITOR:
        return EditorCapabilities.canModifyRole(context);

      case WorkspaceRole.VIEWER:
        return ViewerCapabilities.canModifyRole(context);

      default:
        return false;
    }
  }

  /**
   * Check if user can assign/remove permissions (with context)
   */
  static canModifyMemberPermissions(context: PermissionChangeContext): boolean {
    switch (context.requesterRole) {
      case WorkspaceRole.OWNER:
        return OwnerCapabilities.canAssignPermissions(context);

      case WorkspaceRole.ADMIN:
        return AdminCapabilities.canAssignPermissions(context);

      case WorkspaceRole.EDITOR:
        return EditorCapabilities.canAssignPermissions(context);

      case WorkspaceRole.VIEWER:
        return ViewerCapabilities.canAssignPermissions(context);

      default:
        return false;
    }
  }

  /**
   * Validate role hierarchy for role changes
   */
  static validateRoleHierarchy(
    requesterRole: WorkspaceRole,
    targetRole: WorkspaceRole,
    newRole: WorkspaceRole
  ): { valid: boolean; reason?: string } {
    // Owner trying to promote someone else to owner
    if (
      requesterRole === WorkspaceRole.OWNER &&
      newRole === WorkspaceRole.OWNER &&
      targetRole !== WorkspaceRole.OWNER
    ) {
      return {
        valid: false,
        reason: "Cannot promote users to owner role. Each workspace can only have one owner"
      };
    }

    // Owner trying to demote themselves
    if (
      requesterRole === WorkspaceRole.OWNER &&
      targetRole === WorkspaceRole.OWNER &&
      newRole !== WorkspaceRole.OWNER
    ) {
      return {
        valid: false,
        reason: "Owner cannot demote themselves from owner role"
      };
    }

    // Non-owner trying to modify owner
    if (
      requesterRole !== WorkspaceRole.OWNER &&
      targetRole === WorkspaceRole.OWNER
    ) {
      return {
        valid: false,
        reason: "Only owner can modify owner role"
      };
    }

    // Admin trying to modify another admin
    if (
      requesterRole === WorkspaceRole.ADMIN &&
      targetRole === WorkspaceRole.ADMIN
    ) {
      return {
        valid: false,
        reason: "Admin cannot modify another admin"
      };
    }

    // Non-owner trying to promote to admin or owner
    if (
      requesterRole !== WorkspaceRole.OWNER &&
      (newRole === WorkspaceRole.ADMIN || newRole === WorkspaceRole.OWNER)
    ) {
      return {
        valid: false,
        reason: "Only owner can promote users to admin"
      };
    }

    return { valid: true };
  }
}
