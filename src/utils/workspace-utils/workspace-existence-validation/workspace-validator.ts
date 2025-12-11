import { PrismaClient } from "../../../generated/prisma-client";
import {
  WorkspaceValidationOptions,
  BaseWorkspaceInfo,
  WorkspaceWithAllocation,
} from "./types";

/**
 * WorkspaceValidator - Centralized Workspace Existence Validation
 *
 * Single source of truth for validating workspace existence across the application.
 * Supports flexible queries based on what data is needed (plan, add-ons, members, etc.)
 *
 * @example
 * ```typescript
 * // Basic validation
 * const workspace = await WorkspaceValidator.validateBySlug(prisma, "my-workspace");
 *
 * // With plan and add-ons (for allocation checks)
 * const workspace = await WorkspaceValidator.validateBySlug(prisma, "my-workspace", {
 *   includePlan: true,
 *   includeAddOns: true
 * });
 *
 * // By ID
 * const workspace = await WorkspaceValidator.validateById(prisma, 123);
 * ```
 */
export class WorkspaceValidator {
  /**
   * Validate workspace exists by slug
   *
   * @param prisma - Prisma client instance
   * @param slug - Workspace slug
   * @param options - Validation options for including additional data
   * @returns Validated workspace data
   * @throws Error if workspace not found
   */
  static async validateBySlug<T = BaseWorkspaceInfo>(
    prisma: PrismaClient,
    slug: string,
    options?: WorkspaceValidationOptions
  ): Promise<T> {
    const select = this.buildSelectQuery(options);

    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select,
    });

    if (!workspace) {
      throw new Error("We couldn't find that workspace");
    }

    return workspace as T;
  }

  /**
   * Validate workspace exists by ID
   *
   * @param prisma - Prisma client instance
   * @param id - Workspace ID
   * @param options - Validation options for including additional data
   * @returns Validated workspace data
   * @throws Error if workspace not found
   */
  static async validateById<T = BaseWorkspaceInfo>(
    prisma: PrismaClient,
    id: number,
    options?: WorkspaceValidationOptions
  ): Promise<T> {
    const select = this.buildSelectQuery(options);

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select,
    });

    if (!workspace) {
      throw new Error("We couldn't find that workspace");
    }

    return workspace as T;
  }

  /**
   * Validate workspace exists by slug with full allocation data
   * Convenience method for services that need to check allocations
   *
   * @param prisma - Prisma client instance
   * @param slug - Workspace slug
   * @returns Workspace with owner plan and active add-ons
   * @throws Error if workspace not found
   */
  static async validateWithAllocation(
    prisma: PrismaClient,
    slug: string
  ): Promise<WorkspaceWithAllocation> {
    return this.validateBySlug<WorkspaceWithAllocation>(prisma, slug, {
      includePlan: true,
      includeAddOns: true,
    });
  }

  /**
   * Check if workspace exists (non-throwing)
   *
   * @param prisma - Prisma client instance
   * @param slug - Workspace slug
   * @returns True if workspace exists, false otherwise
   */
  static async exists(prisma: PrismaClient, slug: string): Promise<boolean> {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      select: { id: true },
    });

    return workspace !== null;
  }

  /**
   * Check if workspace exists by ID (non-throwing)
   *
   * @param prisma - Prisma client instance
   * @param id - Workspace ID
   * @returns True if workspace exists, false otherwise
   */
  static async existsById(prisma: PrismaClient, id: number): Promise<boolean> {
    const workspace = await prisma.workspace.findUnique({
      where: { id },
      select: { id: true },
    });

    return workspace !== null;
  }

  /**
   * Build Prisma select query based on options
   *
   * @param options - Validation options
   * @returns Prisma select object
   */
  private static buildSelectQuery(
    options?: WorkspaceValidationOptions
  ): Record<string, unknown> {
    // Use custom select if provided
    if (options?.customSelect) {
      return options.customSelect;
    }

    // Build select based on options
    const select: Record<string, unknown> = {
      id: true,
      name: true,
      ownerId: true,
      status: true,
    };

    // Include owner data if plan or add-ons requested
    if (options?.includePlan || options?.includeAddOns) {
      select.owner = {
        select: {
          ...(options.includePlan && { plan: true }),
          ...(options.includeAddOns && {
            addOns: {
              select: {
                type: true,
                quantity: true,
                status: true,
                endDate: true, // Required for validating if addon is expired
              },
            },
          }),
        },
      };
    }

    if (options?.includeMembers) {
      select.members = {
        select: {
          userId: true,
          role: true,
          permissions: true,
        },
      };
    }

    return select;
  }
}
