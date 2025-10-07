import { BadRequestError } from "../../../errors";
import { PrismaClient } from "../../../generated/prisma-client";

/**
 * Generate a unique, URL-friendly slug from a string
 *
 * This utility:
 * 1. Converts name to lowercase
 * 2. Replaces spaces with hyphens
 * 3. Removes special characters
 * 4. Checks uniqueness in workspace
 * 5. Appends counter if needed (-1, -2, etc.)
 *
 * @param prisma - Prisma client instance
 * @param name - The funnel name to convert to a slug
 * @param workspaceId - Workspace ID to check uniqueness within
 * @param excludeFunnelId - Optional funnel ID to exclude from uniqueness check (for updates)
 * @returns Unique URL-friendly slug (lowercase, alphanumeric with hyphens)
 * @throws BadRequestError if name is empty or contains only invalid characters
 *
 * @example
 * // Create new funnel
 * await generateSlug(prisma, "My Funnel", 123) // Returns: "my-funnel"
 * await generateSlug(prisma, "My Funnel", 123) // Returns: "my-funnel-1" (if first exists)
 *
 * // Update funnel (exclude current funnel from check)
 * await generateSlug(prisma, "Updated Name", 123, 456)
 */
export const generateSlug = async (
  prisma: PrismaClient,
  name: string,
  workspaceId: number,
  excludeFunnelId?: number
): Promise<string> => {
  if (!name || typeof name !== "string") {
    throw new BadRequestError("Funnel name is required to generate slug");
  }

  // Check if name contains invalid characters (anything other than letters, numbers, spaces, hyphens, underscores)
  const invalidChars = name.match(/[^a-zA-Z0-9\s\-_]/g);
  if (invalidChars) {
    throw new BadRequestError(
      "Funnel name contains invalid characters. Please use letters, numbers, spaces, and hyphens only."
    );
  }

  // Generate base slug
  const baseSlug = name
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, "-")
    // Remove special characters except hyphens and alphanumeric
    .replace(/[^a-z0-9-]/g, "")
    // Remove multiple consecutive hyphens
    .replace(/-+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, "");

  // Check if resulting slug is empty (all characters were invalid)
  if (!baseSlug) {
    throw new BadRequestError(
      "Funnel name must contain at least one letter or number."
    );
  }

  // Validate format
  const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!slugPattern.test(baseSlug)) {
    throw new BadRequestError(
      "Funnel name contains invalid characters. Please use letters, numbers, and hyphens only."
    );
  }

  // Check uniqueness and append counter if needed
  let uniqueSlug = baseSlug;
  let counter = 1;

  while (true) {
    const existingFunnel = await prisma.funnel.findFirst({
      where: {
        workspaceId,
        slug: uniqueSlug,
        ...(excludeFunnelId && { id: { not: excludeFunnelId } }),
      },
      select: { id: true },
    });

    if (!existingFunnel) {
      break;
    }

    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
};
