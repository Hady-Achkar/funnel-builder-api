import { PrismaClient } from "../../../../generated/prisma-client";
import { BadRequestError } from "../../../../errors";

/**
 * Validates slug format against allowed pattern
 *
 * Must contain only lowercase letters, numbers, and hyphens.
 * Cannot start or end with hyphen.
 *
 * @param slug - Slug to validate
 * @returns True if valid format, false otherwise
 */
const validateSlugFormat = (slug: string): boolean => {
  if (!slug || typeof slug !== 'string') return false;

  // Check if slug matches valid pattern
  const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return slugPattern.test(slug);
};

/**
 * Checks if slug is unique within workspace
 *
 * @param prisma - Prisma client instance
 * @param slug - Slug to check for uniqueness
 * @param workspaceId - Workspace ID to check within
 * @param excludeFunnelId - Optional funnel ID to exclude from check (for updates)
 * @returns True if slug is unique, false if already exists
 */
const validateSlugUniqueness = async (
  prisma: PrismaClient,
  slug: string,
  workspaceId: number,
  excludeFunnelId?: number
): Promise<boolean> => {
  const existingFunnel = await prisma.funnel.findFirst({
    where: {
      workspaceId,
      slug,
      ...(excludeFunnelId && { id: { not: excludeFunnelId } }),
    },
    select: { id: true },
  });

  return !existingFunnel;
};

/**
 * Generates a unique slug for duplicated funnel within workspace
 *
 * If base slug already exists, appends incrementing numbers until unique.
 * Pattern: "base-slug" → "base-slug-1" → "base-slug-2", etc.
 *
 * Example:
 * - "my-funnel" exists → returns "my-funnel-1"
 * - "my-funnel" and "my-funnel-1" exist → returns "my-funnel-2"
 *
 * @param baseSlug - Base slug generated from funnel name
 * @param workspaceId - Target workspace ID
 * @param excludeFunnelId - Optional funnel ID to exclude from uniqueness check
 * @returns Unique slug with counter suffix if needed
 * @throws BadRequestError if base slug format is invalid
 */
export const generateUniqueSlug = async (
  baseSlug: string,
  workspaceId: number,
  excludeFunnelId?: number
): Promise<string> => {
  if (!validateSlugFormat(baseSlug)) {
    throw new BadRequestError("Funnel name contains invalid characters. Please use letters, numbers, and hyphens only.");
  }

  const { getPrisma } = await import("../../../../lib/prisma");
  const prisma = getPrisma();

  let uniqueSlug = baseSlug;
  let counter = 1;

  while (!(await validateSlugUniqueness(prisma, uniqueSlug, workspaceId, excludeFunnelId))) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};
