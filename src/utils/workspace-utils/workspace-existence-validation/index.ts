/**
 * Workspace Existence Validation
 *
 * Centralized utility for validating workspace existence across the application.
 * Provides consistent error messages and flexible query options.
 *
 * @example
 * ```typescript
 * import { WorkspaceValidator } from '@/utils/workspace-utils/workspace-existence-validation';
 *
 * // Basic validation
 * const workspace = await WorkspaceValidator.validateBySlug(prisma, "my-workspace");
 *
 * // With allocation data
 * const workspace = await WorkspaceValidator.validateWithAllocation(prisma, "my-workspace");
 *
 * // Check existence without throwing
 * const exists = await WorkspaceValidator.exists(prisma, "my-workspace");
 * ```
 */

export { WorkspaceValidator } from "./workspace-validator";
export * from "./types";
