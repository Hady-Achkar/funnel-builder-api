import { getPrisma } from '../../../lib/prisma';

/**
 * Generate a sequential slug for auto-generated funnel names
 *
 * Creates a sequential slug in format: site-{number}
 * Used when funnel is created with auto-generated name
 *
 * @param workspaceId - The workspace ID to check for existing slugs
 * @returns Slug in format "site-{number}"
 *
 * @example
 * generateDateSlug(123) // Returns: "site-1" (if first in workspace)
 * generateDateSlug(123) // Returns: "site-2" (if one exists)
 * generateDateSlug(123) // Returns: "site-5" (if 1-4 exist)
 */
export const generateDateSlug = async (workspaceId: number): Promise<string> => {
  const prisma = getPrisma();

  // Get all existing funnels in workspace to find the highest site number
  const funnels = await prisma.funnel.findMany({
    where: { workspaceId },
    select: { slug: true },
  });

  // Extract site numbers from slugs matching "site-{number}" pattern
  const siteNumbers = funnels
    .map(f => f.slug.match(/^site-(\d+)$/))
    .filter(match => match !== null)
    .map(match => parseInt(match![1], 10));

  // Find the highest number, default to 0 if none exist
  const highestNumber = siteNumbers.length > 0 ? Math.max(...siteNumbers) : 0;

  // Return next sequential number
  return `site-${highestNumber + 1}`;
};
