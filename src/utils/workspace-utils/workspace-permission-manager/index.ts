/**
 * Workspace Permission Manager
 *
 * Centralized permission system for all workspace operations.
 * Single source of truth for permission checks across:
 * - Workspace management
 * - Member management
 * - Funnels, Domains, Pages
 * - Themes, Forms, Insights
 *
 * @example
 * ```typescript
 * // Check permission
 * const result = await PermissionManager.can({
 *   userId: 123,
 *   workspaceId: 456,
 *   action: PermissionAction.CREATE_FUNNEL
 * });
 *
 * // Require permission (throws)
 * await PermissionManager.requirePermission({
 *   userId: 123,
 *   workspaceId: 456,
 *   action: PermissionAction.DELETE_DOMAIN
 * });
 *
 * // Get user capabilities
 * const capabilities = await PermissionManager.getUserCapabilities(123, 456);
 * ```
 */

export { PermissionManager } from "./permission-manager";

export * from "./types";
export * from "./role-capabilities";
export * from "./action-checkers";
