interface PageLinkingMap {
  oldLinkingId: string;
  newLinkingId: string;
}

/**
 * Replaces all old linking IDs with new ones in page content
 *
 * Scans page content for linking ID references and replaces them with
 * new IDs from the linking map. This ensures internal page links in the
 * duplicated funnel point to the correct duplicated pages.
 *
 * Handles linking IDs in multiple contexts:
 * - href attributes: href="linkingId" or href="/linkingId"
 * - src attributes: src="linkingId" or src="/linkingId"
 * - action attributes: action="linkingId"
 * - URL paths: /linkingId
 * - Brackets and parentheses: [linkingId], (linkingId)
 * - Query parameters: ?page=linkingId
 *
 * @param content - Page content HTML/JSON string
 * @param linkingMap - Map of old to new linking IDs
 * @returns Updated content with new linking IDs, or null if no content
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
