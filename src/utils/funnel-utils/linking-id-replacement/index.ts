/**
 * Linking ID Replacement Utilities
 *
 * Used when creating funnels from templates to generate new unique linking IDs
 * and replace all references to old IDs in page content.
 */

interface PageLinkingMap {
  oldLinkingId: string;
  newLinkingId: string;
}

/**
 * Generate a short 8-character alphanumeric ID
 */
export const generateShortId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a mapping of old linking IDs to new unique linking IDs
 *
 * @param templatePages - Array of template pages with linking IDs
 * @returns Array of mappings from old to new linking IDs
 */
export const generateLinkingIdMap = (
  templatePages: Array<{ linkingId: string | null }>
): PageLinkingMap[] => {
  const linkingMap: PageLinkingMap[] = [];
  const usedIds = new Set<string>();

  templatePages.forEach(page => {
    if (page.linkingId) {
      let newId = generateShortId();

      // Ensure uniqueness
      while (usedIds.has(newId)) {
        newId = generateShortId();
      }

      usedIds.add(newId);
      linkingMap.push({
        oldLinkingId: page.linkingId,
        newLinkingId: newId
      });
    }
  });

  return linkingMap;
};

/**
 * Replace all occurrences of old linking IDs with new ones in page content
 *
 * Handles replacements in 9 different contexts:
 * 1. href attributes (with/without leading slash)
 * 2. src attributes (with/without leading slash)
 * 3. action attributes
 * 4. URL paths after slash
 * 5. In brackets [linkingId]
 * 6. In parentheses (linkingId)
 * 7. After equals sign
 * 8. In query parameters
 * 9. As standalone link with word boundaries
 *
 * @param content - Page content to update
 * @param linkingMap - Mapping of old to new linking IDs
 * @returns Updated content with new linking IDs
 */
export const replaceLinkingIdsInContent = (
  content: string | null,
  linkingMap: PageLinkingMap[]
): string | null => {
  if (!content) return content;

  let updatedContent = content;

  linkingMap.forEach(({ oldLinkingId, newLinkingId }) => {
    // Escape special regex characters in the linking ID
    const escapedOldId = oldLinkingId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Replace linking IDs in various link contexts:

    // 1. In href attributes: href="linkingId", href='linkingId', href="/linkingId", href='/linkingId'
    updatedContent = updatedContent.replace(
      new RegExp(`(href\\s*=\\s*["'])/?${escapedOldId}(["'])`, 'gi'),
      `$1${newLinkingId}$2`
    );

    // 2. In src attributes: src="linkingId", src='linkingId', src="/linkingId", src='/linkingId'
    updatedContent = updatedContent.replace(
      new RegExp(`(src\\s*=\\s*["'])/?${escapedOldId}(["'])`, 'gi'),
      `$1${newLinkingId}$2`
    );

    // 3. In action attributes: action="linkingId", action='linkingId'
    updatedContent = updatedContent.replace(
      new RegExp(`(action\\s*=\\s*["'])/?${escapedOldId}(["'])`, 'gi'),
      `$1${newLinkingId}$2`
    );

    // 4. URL paths after slash: /linkingId (word boundary)
    updatedContent = updatedContent.replace(
      new RegExp(`(/)${escapedOldId}\\b`, 'g'),
      `$1${newLinkingId}`
    );

    // 5. In brackets (commonly used for links): [linkingId]
    updatedContent = updatedContent.replace(
      new RegExp(`(\\[)${escapedOldId}(\\])`, 'g'),
      `$1${newLinkingId}$2`
    );

    // 6. In parentheses (commonly used for links): (linkingId)
    updatedContent = updatedContent.replace(
      new RegExp(`(\\()${escapedOldId}(\\))`, 'g'),
      `$1${newLinkingId}$2`
    );

    // 7. After equals sign in any context: =linkingId, ="linkingId", ='linkingId'
    updatedContent = updatedContent.replace(
      new RegExp(`(=["']?)${escapedOldId}(["']?)`, 'g'),
      `$1${newLinkingId}$2`
    );

    // 8. In query parameters: ?page=linkingId, &page=linkingId
    updatedContent = updatedContent.replace(
      new RegExp(`([?&]\\w+=)${escapedOldId}\\b`, 'g'),
      `$1${newLinkingId}`
    );

    // 9. As standalone link (word boundaries): ensure it's not part of another word
    updatedContent = updatedContent.replace(
      new RegExp(`\\b${escapedOldId}\\b(?=[\\s"'\\]\\)/>])`, 'g'),
      newLinkingId
    );
  });

  return updatedContent;
};

/**
 * Get the new linking ID for a page based on the mapping
 *
 * @param oldLinkingId - Original linking ID from template
 * @param linkingMap - Mapping of old to new linking IDs
 * @returns New linking ID or original if not found in map
 */
export const getNewLinkingIdForPage = (
  oldLinkingId: string | null,
  linkingMap: PageLinkingMap[]
): string | null => {
  if (!oldLinkingId) return null;

  const mapping = linkingMap.find(map => map.oldLinkingId === oldLinkingId);
  return mapping ? mapping.newLinkingId : oldLinkingId;
};
