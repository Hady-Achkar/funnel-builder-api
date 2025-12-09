/**
 * Validates that a slug contains only allowed characters.
 * Allowed: letters, numbers, spaces, and hyphens.
 * Returns true if valid, false if invalid.
 */
export function isValidSlugFormat(slug: string): boolean {
  const slugRegex = /^[a-zA-Z0-9\s-]+$/;
  return slugRegex.test(slug);
}
