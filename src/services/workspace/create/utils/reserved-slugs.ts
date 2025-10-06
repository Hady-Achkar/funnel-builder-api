/**
 * Pure utility function to check if a slug is reserved
 * NO Prisma, NO error throwing - just returns boolean
 */

const RESERVED_SLUGS = [
  'api', 'www', 'admin', 'dashboard', 'app', 'mail', 'ftp', 'blog',
  'help', 'support', 'docs', 'status', 'cdn', 'assets', 'static',
  'images', 'img', 'css', 'js', 'fonts', 'media', 'files'
];

/**
 * Check if a slug is in the reserved list
 * @param slug - The slug to check
 * @returns true if slug is reserved, false otherwise
 */
export function isSlugReserved(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}
