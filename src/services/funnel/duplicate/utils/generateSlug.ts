import { BadRequestError } from "../../../../errors";

/**
 * Generates a URL-friendly slug from funnel name
 *
 * Converts funnel name to a valid URL slug by:
 * - Converting to lowercase
 * - Replacing spaces and underscores with hyphens
 * - Removing special characters
 * - Removing multiple/leading/trailing hyphens
 *
 * Example: "My Funnel Name!" → "my-funnel-name"
 *
 * @param name - Funnel name to convert to slug
 * @returns URL-friendly slug (lowercase, alphanumeric with hyphens)
 * @throws BadRequestError if name is empty or contains only invalid characters
 */
export const generateSlug = (name: string): string => {
  if (!name || typeof name !== 'string') {
    throw new BadRequestError("Funnel name is required to generate slug");
  }

  const slug = name
    .toLowerCase()
    .trim()
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove special characters except hyphens and alphanumeric (parentheses get removed here)
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
