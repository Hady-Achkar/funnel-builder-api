interface PageLinkingMap {
  oldLinkingId: string;
  newLinkingId: string;
}

/**
 * Generates a random 8-character alphanumeric linking ID
 *
 * @returns Random 8-character lowercase alphanumeric string
 */
const generateShortId = (): string => {
  // Generate a short 8-character ID using alphanumeric characters
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generates a mapping of old linking IDs to new unique linking IDs
 *
 * Linking IDs are used for internal page references in funnel content.
 * When duplicating, all linking IDs must be regenerated to avoid conflicts.
 * This map is used to replace old IDs with new ones in page content.
 *
 * Example: If page "about" has linkingId "abc123", the map will contain
 * { oldLinkingId: "abc123", newLinkingId: "xyz789" }
 *
 * @param pages - Array of pages from original funnel
 * @returns Array mapping each old linking ID to a new unique ID
 */
export const generateLinkingIdMap = (pages: Array<{ linkingId: string | null }>): PageLinkingMap[] => {
  const linkingMap: PageLinkingMap[] = [];
  const usedIds = new Set<string>();

  pages.forEach(page => {
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
