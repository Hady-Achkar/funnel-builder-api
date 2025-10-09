import { getPrisma } from "../../../lib/prisma";

/**
 * Generates a linking ID from a page name by converting to lowercase,
 * replacing spaces and special characters with hyphens, and ensuring uniqueness
 */
export const generateLinkingId = (name: string): string => {
  if (!name || typeof name !== 'string') {
    return 'page';
  }

  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Generates a unique linking ID for a page within a funnel
 * If the generated ID already exists, appends a number to make it unique
 * @param name - The page name to generate linking ID from
 * @param funnelId - The funnel ID to check uniqueness within
 * @param excludePageId - Optional page ID to exclude from uniqueness check (for updates)
 */
export const generateUniqueLinkingId = async (
  name: string,
  funnelId: number,
  excludePageId?: number
): Promise<string> => {
  const prisma = getPrisma();

  let baseLinkingId = generateLinkingId(name);

  // Fallback if name generates empty linking ID
  if (!baseLinkingId) {
    baseLinkingId = 'page';
  }

  let linkingId = baseLinkingId;
  let counter = 1;

  // Check if linking ID already exists in the funnel
  while (true) {
    const existingPage = await prisma.page.findFirst({
      where: {
        funnelId,
        linkingId,
        ...(excludePageId ? { id: { not: excludePageId } } : {}),
      },
      select: { id: true },
    });

    if (!existingPage) {
      break; // Unique linking ID found
    }

    counter++;
    linkingId = `${baseLinkingId}-${counter}`;
  }

  return linkingId;
};