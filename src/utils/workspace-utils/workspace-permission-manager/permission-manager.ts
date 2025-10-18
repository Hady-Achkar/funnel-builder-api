import { getPrisma } from "../../../lib/prisma";
import { WorkspaceRole, WorkspacePermission } from "../../../generated/prisma-client";
import {
  PermissionAction,
  PermissionCheckContext,
  PermissionCheckResult,
  UserCapabilities,
  RoleChangeContext,
  PermissionChangeContext,
  WorkspaceMemberInfo,
} from "./types";
import {
  WorkspaceActionChecker,
  MemberActionChecker,
  FunnelActionChecker,
  DomainActionChecker,
  PageActionChecker,
  ThemeActionChecker,
  FormActionChecker,
  InsightActionChecker,
} from "./action-checkers";
import { OwnerCapabilities, AdminCapabilities, EditorCapabilities, ViewerCapabilities } from "./role-capabilities";

/**
 * PermissionManager - Single Source of Truth for Workspace Permissions
 *
 * This class centralizes ALL permission logic across:
 * - Workspace management
 * - Member management
 * - Funnel operations
 * - Domain operations
 * - Page operations
 * - Theme operations
 * - Form operations
 * - Insight operations
 *
 * Usage:
 * ```typescript
 * // Check permission (non-throwing)
 * const result = await PermissionManager.can({
 *   userId: 123,
 *   workspaceId: 456,
 *   action: PermissionAction.CREATE_FUNNEL
 * });
 *
 * // Require permission (throws if not allowed)
 * await PermissionManager.requirePermission({
 *   userId: 123,
 *   workspaceId: 456,
 *   action: PermissionAction.DELETE_DOMAIN
 * });
 * ```
 */
export class PermissionManager {
  /**
   * Check if a user can perform an action (non-throwing)
   *
   * @param context - Permission check context
   * @returns Permission check result with details
   */
  static async can(context: PermissionCheckContext): Promise<PermissionCheckResult> {
    try {
      const memberInfo = await this.getWorkspaceMemberInfo(
        context.userId,
        context.workspaceId
      );

      if (!memberInfo) {
        return {
          allowed: false,
          reason: "You don't have access to this workspace",
          userRole: WorkspaceRole.VIEWER, // Default
          userPermissions: [],
          isOwner: false,
        };
      }

      const allowed = await this.checkPermission(
        context.action,
        memberInfo,
        context
      );

      return {
        allowed,
        reason: allowed ? undefined : this.getPermissionDeniedReason(context.action, memberInfo.role),
        userRole: memberInfo.role,
        userPermissions: memberInfo.permissions,
        isOwner: await this.isWorkspaceOwner(context.userId, context.workspaceId),
      };
    } catch (error) {
      return {
        allowed: false,
        reason: error instanceof Error ? error.message : "Permission check failed",
        userRole: WorkspaceRole.VIEWER,
        userPermissions: [],
        isOwner: false,
      };
    }
  }

  /**
   * Require a user to have permission (throws if not allowed)
   *
   * @param context - Permission check context
   * @throws Error if user doesn't have permission
   */
  static async requirePermission(context: PermissionCheckContext): Promise<void> {
    const result = await this.can(context);

    if (!result.allowed) {
      throw new Error(
        result.reason || `You don't have permission to perform this action`
      );
    }
  }

  /**
   * Get user's full capabilities in a workspace
   *
   * @param userId - User ID
   * @param workspaceId - Workspace ID
   * @returns User capabilities object
   */
  static async getUserCapabilities(
    userId: number,
    workspaceId: number
  ): Promise<UserCapabilities | null> {
    const memberInfo = await this.getWorkspaceMemberInfo(userId, workspaceId);

    if (!memberInfo) {
      return null;
    }

    const isOwner = await this.isWorkspaceOwner(userId, workspaceId);

    return {
      userId,
      workspaceId,
      role: memberInfo.role,
      permissions: memberInfo.permissions,
      isOwner,
      canPerformActions: {
        // Workspace
        manageSettings: await this.checkPermission(
          PermissionAction.MANAGE_WORKSPACE_SETTINGS,
          memberInfo
        ),
        manageAllocations: await this.checkPermission(
          PermissionAction.MANAGE_WORKSPACE_ALLOCATIONS,
          memberInfo
        ),
        deleteWorkspace: await this.checkPermission(
          PermissionAction.DELETE_WORKSPACE,
          memberInfo
        ),
        // Members
        inviteMembers: await this.checkPermission(
          PermissionAction.INVITE_MEMBER,
          memberInfo
        ),
        removeMembers: await this.checkPermission(
          PermissionAction.REMOVE_MEMBER,
          memberInfo
        ),
        modifyRoles: await this.checkPermission(
          PermissionAction.MODIFY_MEMBER_ROLE,
          memberInfo
        ),
        modifyPermissions: await this.checkPermission(
          PermissionAction.MODIFY_MEMBER_PERMISSIONS,
          memberInfo
        ),
        // Funnels
        createFunnels: await this.checkPermission(
          PermissionAction.CREATE_FUNNEL,
          memberInfo
        ),
        editFunnels: await this.checkPermission(
          PermissionAction.EDIT_FUNNEL,
          memberInfo
        ),
        deleteFunnels: await this.checkPermission(
          PermissionAction.DELETE_FUNNEL,
          memberInfo
        ),
        duplicateFunnels: await this.checkPermission(
          PermissionAction.DUPLICATE_FUNNEL,
          memberInfo
        ),
        // Domains
        createDomains: await this.checkPermission(
          PermissionAction.CREATE_SUBDOMAIN,
          memberInfo
        ),
        deleteDomains: await this.checkPermission(
          PermissionAction.DELETE_DOMAIN,
          memberInfo
        ),
        manageDomains: await this.checkPermission(
          PermissionAction.MANAGE_DOMAIN,
          memberInfo
        ),
        connectDomains: await this.checkPermission(
          PermissionAction.CONNECT_DOMAIN,
          memberInfo
        ),
        // Pages
        createPages: await this.checkPermission(
          PermissionAction.CREATE_PAGE,
          memberInfo
        ),
        editPages: await this.checkPermission(
          PermissionAction.EDIT_PAGE,
          memberInfo
        ),
        deletePages: await this.checkPermission(
          PermissionAction.DELETE_PAGE,
          memberInfo
        ),
        // Themes
        createThemes: await this.checkPermission(
          PermissionAction.CREATE_THEME,
          memberInfo
        ),
        updateThemes: await this.checkPermission(
          PermissionAction.UPDATE_THEME,
          memberInfo
        ),
        setActiveThemes: await this.checkPermission(
          PermissionAction.SET_ACTIVE_THEME,
          memberInfo
        ),
        // Forms
        createForms: await this.checkPermission(
          PermissionAction.CREATE_FORM,
          memberInfo
        ),
        updateForms: await this.checkPermission(
          PermissionAction.UPDATE_FORM,
          memberInfo
        ),
        deleteForms: await this.checkPermission(
          PermissionAction.DELETE_FORM,
          memberInfo
        ),
        // Insights
        createInsights: await this.checkPermission(
          PermissionAction.CREATE_INSIGHT,
          memberInfo
        ),
        updateInsights: await this.checkPermission(
          PermissionAction.UPDATE_INSIGHT,
          memberInfo
        ),
        deleteInsights: await this.checkPermission(
          PermissionAction.DELETE_INSIGHT,
          memberInfo
        ),
        // Analytics
        viewAnalytics: await this.checkPermission(
          PermissionAction.VIEW_ANALYTICS,
          memberInfo
        ),
        exportAnalytics: await this.checkPermission(
          PermissionAction.EXPORT_ANALYTICS,
          memberInfo
        ),
        // Media
        uploadImages: await this.checkPermission(
          PermissionAction.UPLOAD_IMAGE,
          memberInfo
        ),
        manageImageFolders: await this.checkPermission(
          PermissionAction.MANAGE_IMAGE_FOLDERS,
          memberInfo
        ),
      },
    };
  }

  /**
   * Validate if a user can modify another member's role
   *
   * @param context - Role change context
   * @returns Validation result
   */
  static validateRoleChange(context: RoleChangeContext): {
    valid: boolean;
    reason?: string;
  } {
    // First check hierarchy
    const hierarchyCheck = MemberActionChecker.validateRoleHierarchy(
      context.requesterRole,
      context.targetRole,
      context.newRole
    );

    if (!hierarchyCheck.valid) {
      return hierarchyCheck;
    }

    // Then check if user can modify this role
    const canModify = MemberActionChecker.canModifyMemberRole(context);

    if (!canModify) {
      return {
        valid: false,
        reason: this.getRoleModificationDeniedReason(context.requesterRole),
      };
    }

    return { valid: true };
  }

  /**
   * Validate if a user can modify another member's permissions
   *
   * @param context - Permission change context
   * @returns Validation result
   */
  static validatePermissionChange(context: PermissionChangeContext): {
    valid: boolean;
    reason?: string;
  } {
    const canModify = MemberActionChecker.canModifyMemberPermissions(context);

    if (!canModify) {
      return {
        valid: false,
        reason: this.getPermissionModificationDeniedReason(context.requesterRole),
      };
    }

    return { valid: true };
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Get workspace member info for a user
   */
  private static async getWorkspaceMemberInfo(
    userId: number,
    workspaceId: number
  ): Promise<WorkspaceMemberInfo | null> {
    const prisma = getPrisma();

    // Check if user is owner
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });

    if (!workspace) {
      return null;
    }

    if (workspace.ownerId === userId) {
      // Owner has all permissions
      return {
        userId,
        role: WorkspaceRole.OWNER,
        permissions: Object.values(WorkspacePermission),
      };
    }

    // Check if user is a member
    const member = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
      select: {
        role: true,
        permissions: true,
      },
    });

    if (!member) {
      return null;
    }

    return {
      userId,
      role: member.role,
      permissions: member.permissions,
    };
  }

  /**
   * Check if user is workspace owner
   */
  private static async isWorkspaceOwner(
    userId: number,
    workspaceId: number
  ): Promise<boolean> {
    const prisma = getPrisma();

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true },
    });

    return workspace?.ownerId === userId;
  }

  /**
   * Check if user has permission to perform an action
   */
  private static async checkPermission(
    action: PermissionAction,
    memberInfo: WorkspaceMemberInfo,
    context?: PermissionCheckContext
  ): Promise<boolean> {
    const { role, permissions } = memberInfo;

    // Route to appropriate action checker based on action type
    if (this.isWorkspaceAction(action)) {
      return WorkspaceActionChecker.canPerformAction(action, role, permissions);
    }

    if (this.isMemberAction(action)) {
      // Member actions may need hierarchy validation
      if (context?.targetRole && (action === PermissionAction.REMOVE_MEMBER)) {
        // Check if user can affect this target role
        const hierarchyValid = this.canAffectRole(role, context.targetRole);
        if (!hierarchyValid) {
          return false;
        }
      }
      return MemberActionChecker.canPerformAction(action, role, permissions);
    }

    if (this.isFunnelAction(action)) {
      return FunnelActionChecker.canPerformAction(action, role, permissions);
    }

    if (this.isDomainAction(action)) {
      return DomainActionChecker.canPerformAction(action, role, permissions);
    }

    if (this.isPageAction(action)) {
      return PageActionChecker.canPerformAction(action, role, permissions);
    }

    if (this.isThemeAction(action)) {
      return ThemeActionChecker.canPerformAction(action, role, permissions);
    }

    if (this.isFormAction(action)) {
      return FormActionChecker.canPerformAction(action, role, permissions);
    }

    if (this.isInsightAction(action)) {
      return InsightActionChecker.canPerformAction(action, role, permissions);
    }

    if (this.isAnalyticsAction(action)) {
      return this.canPerformAnalyticsAction(action, role, permissions);
    }

    if (this.isMediaAction(action)) {
      return this.canPerformMediaAction(action, role, permissions);
    }

    // Default to false for unknown actions
    return false;
  }

  /**
   * Check if requester can affect target role
   */
  private static canAffectRole(requesterRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
    const roleHierarchy = {
      [WorkspaceRole.OWNER]: 4,
      [WorkspaceRole.ADMIN]: 3,
      [WorkspaceRole.EDITOR]: 2,
      [WorkspaceRole.VIEWER]: 1,
    };

    const requesterLevel = roleHierarchy[requesterRole];
    const targetLevel = roleHierarchy[targetRole];

    // Can only affect roles lower in hierarchy
    return requesterLevel > targetLevel;
  }

  // Action type checkers
  private static isWorkspaceAction(action: PermissionAction): boolean {
    return [
      PermissionAction.MANAGE_WORKSPACE_SETTINGS,
      PermissionAction.MANAGE_WORKSPACE_ALLOCATIONS,
      PermissionAction.DELETE_WORKSPACE,
      PermissionAction.VIEW_WORKSPACE,
      PermissionAction.UPDATE_WORKSPACE,
    ].includes(action);
  }

  private static isMemberAction(action: PermissionAction): boolean {
    return [
      PermissionAction.INVITE_MEMBER,
      PermissionAction.REMOVE_MEMBER,
      PermissionAction.MODIFY_MEMBER_ROLE,
      PermissionAction.MODIFY_MEMBER_PERMISSIONS,
      PermissionAction.VIEW_MEMBERS,
      PermissionAction.LEAVE_WORKSPACE,
    ].includes(action);
  }

  private static isFunnelAction(action: PermissionAction): boolean {
    return [
      PermissionAction.CREATE_FUNNEL,
      PermissionAction.VIEW_FUNNEL,
      PermissionAction.EDIT_FUNNEL,
      PermissionAction.DELETE_FUNNEL,
      PermissionAction.DUPLICATE_FUNNEL,
      PermissionAction.ARCHIVE_FUNNEL,
      PermissionAction.RESTORE_FUNNEL,
    ].includes(action);
  }

  private static isDomainAction(action: PermissionAction): boolean {
    return [
      PermissionAction.CREATE_SUBDOMAIN,
      PermissionAction.CREATE_CUSTOM_DOMAIN,
      PermissionAction.DELETE_DOMAIN,
      PermissionAction.CONNECT_DOMAIN,
      PermissionAction.DISCONNECT_DOMAIN,
      PermissionAction.MANAGE_DOMAIN,
      PermissionAction.VERIFY_DOMAIN,
      PermissionAction.VIEW_DOMAINS,
    ].includes(action);
  }

  private static isPageAction(action: PermissionAction): boolean {
    return [
      PermissionAction.CREATE_PAGE,
      PermissionAction.VIEW_PAGE,
      PermissionAction.EDIT_PAGE,
      PermissionAction.DELETE_PAGE,
      PermissionAction.DUPLICATE_PAGE,
      PermissionAction.REORDER_PAGE,
    ].includes(action);
  }

  private static isThemeAction(action: PermissionAction): boolean {
    return [
      PermissionAction.CREATE_THEME,
      PermissionAction.UPDATE_THEME,
      PermissionAction.DELETE_THEME,
      PermissionAction.SET_ACTIVE_THEME,
      PermissionAction.VIEW_THEMES,
    ].includes(action);
  }

  private static isFormAction(action: PermissionAction): boolean {
    return [
      PermissionAction.CREATE_FORM,
      PermissionAction.UPDATE_FORM,
      PermissionAction.DELETE_FORM,
      PermissionAction.VIEW_FORM,
      PermissionAction.CONFIGURE_FORM_WEBHOOK,
    ].includes(action);
  }

  private static isInsightAction(action: PermissionAction): boolean {
    return [
      PermissionAction.CREATE_INSIGHT,
      PermissionAction.UPDATE_INSIGHT,
      PermissionAction.DELETE_INSIGHT,
      PermissionAction.VIEW_INSIGHT,
      PermissionAction.VIEW_INSIGHT_SUBMISSIONS,
    ].includes(action);
  }

  private static isAnalyticsAction(action: PermissionAction): boolean {
    return [
      PermissionAction.VIEW_ANALYTICS,
      PermissionAction.EXPORT_ANALYTICS,
    ].includes(action);
  }

  private static isMediaAction(action: PermissionAction): boolean {
    return [
      PermissionAction.UPLOAD_IMAGE,
      PermissionAction.DELETE_IMAGE,
      PermissionAction.MANAGE_IMAGE_FOLDERS,
    ].includes(action);
  }

  /**
   * Check if user can perform analytics actions
   */
  private static canPerformAnalyticsAction(
    action: PermissionAction,
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (action) {
      case PermissionAction.VIEW_ANALYTICS:
        // All roles can view analytics if they have the permission
        return role === WorkspaceRole.OWNER ||
               role === WorkspaceRole.ADMIN ||
               permissions.includes(WorkspacePermission.VIEW_ANALYTICS);

      case PermissionAction.EXPORT_ANALYTICS:
        // Only owner/admin or users with VIEW_ANALYTICS permission
        return role === WorkspaceRole.OWNER ||
               role === WorkspaceRole.ADMIN ||
               permissions.includes(WorkspacePermission.VIEW_ANALYTICS);

      default:
        return false;
    }
  }

  /**
   * Check if user can perform media actions
   */
  private static canPerformMediaAction(
    action: PermissionAction,
    role: WorkspaceRole,
    permissions: WorkspacePermission[]
  ): boolean {
    switch (action) {
      case PermissionAction.UPLOAD_IMAGE:
        // Editors and above can upload
        return role === WorkspaceRole.OWNER ||
               role === WorkspaceRole.ADMIN ||
               (role === WorkspaceRole.EDITOR && permissions.includes(WorkspacePermission.EDIT_PAGES));

      case PermissionAction.DELETE_IMAGE:
        // Admins and above can delete
        return role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;

      case PermissionAction.MANAGE_IMAGE_FOLDERS:
        // Admins and above can manage folders
        return role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;

      default:
        return false;
    }
  }

  // Error message generators
  private static getPermissionDeniedReason(
    action: PermissionAction,
    role: WorkspaceRole
  ): string {
    const actionName = action.toLowerCase().replace(/_/g, " ");
    return `You don't have permission to ${actionName}. Your role (${role}) doesn't allow this action. Contact the workspace owner or an admin for access.`;
  }

  private static getRoleModificationDeniedReason(role: WorkspaceRole): string {
    switch (role) {
      case WorkspaceRole.ADMIN:
        return "Admins cannot modify other admins or the owner";
      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        return "You need MANAGE_MEMBERS permission to modify member roles";
      default:
        return "You don't have permission to modify member roles";
    }
  }

  private static getPermissionModificationDeniedReason(role: WorkspaceRole): string {
    switch (role) {
      case WorkspaceRole.ADMIN:
        return "Admins cannot modify permissions for other admins or the owner";
      case WorkspaceRole.EDITOR:
      case WorkspaceRole.VIEWER:
        return "You need MANAGE_MEMBERS permission to modify member permissions";
      default:
        return "You don't have permission to modify member permissions";
    }
  }
}
