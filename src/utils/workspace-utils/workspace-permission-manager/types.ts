import { WorkspaceRole, WorkspacePermission } from "../../../generated/prisma-client";

/**
 * All possible permission actions across workspace resources
 * This enum serves as the single source of truth for what actions can be performed
 */
export enum PermissionAction {
  // ========== WORKSPACE MANAGEMENT ==========
  MANAGE_WORKSPACE_SETTINGS = "MANAGE_WORKSPACE_SETTINGS",
  MANAGE_WORKSPACE_ALLOCATIONS = "MANAGE_WORKSPACE_ALLOCATIONS",
  DELETE_WORKSPACE = "DELETE_WORKSPACE",
  VIEW_WORKSPACE = "VIEW_WORKSPACE",
  UPDATE_WORKSPACE = "UPDATE_WORKSPACE",

  // ========== MEMBER MANAGEMENT ==========
  INVITE_MEMBER = "INVITE_MEMBER",
  REMOVE_MEMBER = "REMOVE_MEMBER",
  MODIFY_MEMBER_ROLE = "MODIFY_MEMBER_ROLE",
  MODIFY_MEMBER_PERMISSIONS = "MODIFY_MEMBER_PERMISSIONS",
  VIEW_MEMBERS = "VIEW_MEMBERS",
  LEAVE_WORKSPACE = "LEAVE_WORKSPACE",

  // ========== FUNNEL OPERATIONS ==========
  CREATE_FUNNEL = "CREATE_FUNNEL",
  VIEW_FUNNEL = "VIEW_FUNNEL",
  EDIT_FUNNEL = "EDIT_FUNNEL",
  DELETE_FUNNEL = "DELETE_FUNNEL",
  DUPLICATE_FUNNEL = "DUPLICATE_FUNNEL",
  ARCHIVE_FUNNEL = "ARCHIVE_FUNNEL",
  RESTORE_FUNNEL = "RESTORE_FUNNEL",

  // ========== PAGE OPERATIONS ==========
  CREATE_PAGE = "CREATE_PAGE",
  VIEW_PAGE = "VIEW_PAGE",
  EDIT_PAGE = "EDIT_PAGE",
  DELETE_PAGE = "DELETE_PAGE",
  DUPLICATE_PAGE = "DUPLICATE_PAGE",
  REORDER_PAGE = "REORDER_PAGE",

  // ========== DOMAIN OPERATIONS ==========
  CREATE_SUBDOMAIN = "CREATE_SUBDOMAIN",
  CREATE_CUSTOM_DOMAIN = "CREATE_CUSTOM_DOMAIN",
  DELETE_DOMAIN = "DELETE_DOMAIN",
  CONNECT_DOMAIN = "CONNECT_DOMAIN",
  DISCONNECT_DOMAIN = "DISCONNECT_DOMAIN",
  MANAGE_DOMAIN = "MANAGE_DOMAIN",
  VERIFY_DOMAIN = "VERIFY_DOMAIN",
  VIEW_DOMAINS = "VIEW_DOMAINS",

  // ========== THEME OPERATIONS ==========
  CREATE_THEME = "CREATE_THEME",
  UPDATE_THEME = "UPDATE_THEME",
  DELETE_THEME = "DELETE_THEME",
  SET_ACTIVE_THEME = "SET_ACTIVE_THEME",
  VIEW_THEMES = "VIEW_THEMES",

  // ========== FORM OPERATIONS ==========
  CREATE_FORM = "CREATE_FORM",
  UPDATE_FORM = "UPDATE_FORM",
  DELETE_FORM = "DELETE_FORM",
  VIEW_FORM = "VIEW_FORM",
  CONFIGURE_FORM_WEBHOOK = "CONFIGURE_FORM_WEBHOOK",

  // ========== INSIGHT OPERATIONS ==========
  CREATE_INSIGHT = "CREATE_INSIGHT",
  UPDATE_INSIGHT = "UPDATE_INSIGHT",
  DELETE_INSIGHT = "DELETE_INSIGHT",
  VIEW_INSIGHT = "VIEW_INSIGHT",
  VIEW_INSIGHT_SUBMISSIONS = "VIEW_INSIGHT_SUBMISSIONS",

  // ========== ANALYTICS ==========
  VIEW_ANALYTICS = "VIEW_ANALYTICS",
  EXPORT_ANALYTICS = "EXPORT_ANALYTICS",

  // ========== IMAGE/MEDIA MANAGEMENT ==========
  UPLOAD_IMAGE = "UPLOAD_IMAGE",
  DELETE_IMAGE = "DELETE_IMAGE",
  MANAGE_IMAGE_FOLDERS = "MANAGE_IMAGE_FOLDERS",
}

/**
 * Context for permission checks
 */
export interface PermissionCheckContext {
  userId: number;
  workspaceId: number;
  action: PermissionAction;
  resourceId?: number; // Optional: for resource-specific checks
  targetUserId?: number; // Optional: for member management actions
  targetRole?: WorkspaceRole; // Optional: for role change validation
  newRole?: WorkspaceRole; // Optional: for role change validation
}

/**
 * Result of a permission check
 */
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  userRole: WorkspaceRole;
  userPermissions: WorkspacePermission[];
  isOwner: boolean;
}

/**
 * User's capabilities in a workspace
 */
export interface UserCapabilities {
  userId: number;
  workspaceId: number;
  role: WorkspaceRole;
  permissions: WorkspacePermission[];
  isOwner: boolean;
  canPerformActions: {
    // Workspace
    manageSettings: boolean;
    manageAllocations: boolean;
    deleteWorkspace: boolean;
    // Members
    inviteMembers: boolean;
    removeMembers: boolean;
    modifyRoles: boolean;
    modifyPermissions: boolean;
    // Funnels
    createFunnels: boolean;
    editFunnels: boolean;
    deleteFunnels: boolean;
    duplicateFunnels: boolean;
    // Domains
    createDomains: boolean;
    deleteDomains: boolean;
    manageDomains: boolean;
    connectDomains: boolean;
    // Pages
    createPages: boolean;
    editPages: boolean;
    deletePages: boolean;
    // Themes
    createThemes: boolean;
    updateThemes: boolean;
    setActiveThemes: boolean;
    // Forms
    createForms: boolean;
    updateForms: boolean;
    deleteForms: boolean;
    // Insights
    createInsights: boolean;
    updateInsights: boolean;
    deleteInsights: boolean;
    // Analytics
    viewAnalytics: boolean;
    exportAnalytics: boolean;
    // Media
    uploadImages: boolean;
    manageImageFolders: boolean;
  };
}

/**
 * Role change validation context
 */
export interface RoleChangeContext {
  requesterId: number;
  requesterRole: WorkspaceRole;
  requesterPermissions: WorkspacePermission[];
  targetMemberId: number;
  targetRole: WorkspaceRole;
  newRole: WorkspaceRole;
  isOwner: boolean;
}

/**
 * Permission change validation context
 */
export interface PermissionChangeContext {
  requesterId: number;
  requesterRole: WorkspaceRole;
  requesterPermissions: WorkspacePermission[];
  targetMemberId: number;
  targetRole: WorkspaceRole;
  permissionsToAdd: WorkspacePermission[];
  permissionsToRemove: WorkspacePermission[];
  isOwner: boolean;
}

/**
 * Workspace member info for permission checks
 */
export interface WorkspaceMemberInfo {
  userId: number;
  role: WorkspaceRole;
  permissions: WorkspacePermission[];
}

/**
 * Permission mapping: Which WorkspacePermission is required for each action
 */
export const ACTION_PERMISSION_MAP: Partial<Record<PermissionAction, WorkspacePermission[]>> = {
  // Workspace
  [PermissionAction.MANAGE_WORKSPACE_SETTINGS]: [WorkspacePermission.MANAGE_WORKSPACE],
  [PermissionAction.MANAGE_WORKSPACE_ALLOCATIONS]: [WorkspacePermission.MANAGE_WORKSPACE],

  // Members
  [PermissionAction.INVITE_MEMBER]: [WorkspacePermission.MANAGE_MEMBERS],
  [PermissionAction.REMOVE_MEMBER]: [WorkspacePermission.MANAGE_MEMBERS],
  [PermissionAction.MODIFY_MEMBER_ROLE]: [WorkspacePermission.MANAGE_MEMBERS],
  [PermissionAction.MODIFY_MEMBER_PERMISSIONS]: [WorkspacePermission.MANAGE_MEMBERS],

  // Funnels
  [PermissionAction.CREATE_FUNNEL]: [WorkspacePermission.CREATE_FUNNELS],
  [PermissionAction.EDIT_FUNNEL]: [WorkspacePermission.EDIT_FUNNELS],
  [PermissionAction.DELETE_FUNNEL]: [WorkspacePermission.DELETE_FUNNELS],
  [PermissionAction.DUPLICATE_FUNNEL]: [WorkspacePermission.CREATE_FUNNELS],

  // Pages
  [PermissionAction.CREATE_PAGE]: [WorkspacePermission.EDIT_PAGES],
  [PermissionAction.EDIT_PAGE]: [WorkspacePermission.EDIT_PAGES],
  [PermissionAction.DELETE_PAGE]: [WorkspacePermission.EDIT_PAGES],

  // Domains
  [PermissionAction.CREATE_SUBDOMAIN]: [WorkspacePermission.CREATE_DOMAINS],
  [PermissionAction.CREATE_CUSTOM_DOMAIN]: [WorkspacePermission.CREATE_DOMAINS],
  [PermissionAction.DELETE_DOMAIN]: [WorkspacePermission.DELETE_DOMAINS],
  [PermissionAction.CONNECT_DOMAIN]: [WorkspacePermission.CONNECT_DOMAINS],
  [PermissionAction.DISCONNECT_DOMAIN]: [WorkspacePermission.CONNECT_DOMAINS],
  [PermissionAction.MANAGE_DOMAIN]: [WorkspacePermission.MANAGE_DOMAINS],

  // Analytics
  [PermissionAction.VIEW_ANALYTICS]: [WorkspacePermission.VIEW_ANALYTICS],
};
