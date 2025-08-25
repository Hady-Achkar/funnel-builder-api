import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors";

/**
 * Generate a URL-friendly slug from a string
 * Converts to lowercase, replaces spaces with hyphens, removes special characters
 */
export const generateSlug = (name: string): string => {
  if (!name || typeof name !== 'string') {
    throw new BadRequestError("Funnel name is required to generate slug");
  }

  // Check if name contains invalid characters (anything other than letters, numbers, spaces, hyphens, underscores)
  const invalidChars = name.match(/[^a-zA-Z0-9\s\-_]/g);
  if (invalidChars) {
    throw new BadRequestError("Funnel name contains invalid characters. Please use letters, numbers, spaces, and hyphens only.");
  }

  const slug = name
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove special characters except hyphens and alphanumeric
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '');

  // Check if resulting slug is empty (all characters were invalid)
  if (!slug) {
    throw new BadRequestError("Funnel name must contain at least one letter or number.");
  }

  return slug;
};

/**
 * Generate a unique slug from a date (for auto-generated funnel names)
 * Format: dd-mm-yyyy-hh-mm
 */
export const generateDateSlug = (date: Date = new Date()): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year}-${hour}-${minute}`;
};

/**
 * Validate slug format
 * Must contain only lowercase letters, numbers, and hyphens
 * Cannot start or end with hyphen
 */
export const validateSlugFormat = (slug: string): boolean => {
  if (!slug || typeof slug !== 'string') return false;
  
  // Check if slug matches valid pattern
  const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return slugPattern.test(slug);
};

/**
 * Check if slug is unique within workspace
 * @param slug - The slug to check
 * @param workspaceId - The workspace ID
 * @param excludeFunnelId - Optional funnel ID to exclude from check (for updates)
 */
export const validateSlugUniqueness = async (
  slug: string,
  workspaceId: number,
  excludeFunnelId?: number
): Promise<boolean> => {
  const prisma = getPrisma();
  
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
 * Generate a unique slug for a funnel within a workspace
 * If base slug exists, append incrementing number
 */
export const generateUniqueSlug = async (
  baseSlug: string,
  workspaceId: number,
  excludeFunnelId?: number
): Promise<string> => {
  if (!validateSlugFormat(baseSlug)) {
    throw new BadRequestError("Funnel name contains invalid characters. Please use letters, numbers, and hyphens only.");
  }

  let uniqueSlug = baseSlug;
  let counter = 1;
  
  while (!(await validateSlugUniqueness(uniqueSlug, workspaceId, excludeFunnelId))) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
};