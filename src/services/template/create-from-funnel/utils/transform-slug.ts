/**
 * Transforms a slug string to a URL-friendly format.
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes consecutive hyphens
 * - Trims leading/trailing hyphens
 */
export function transformSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
