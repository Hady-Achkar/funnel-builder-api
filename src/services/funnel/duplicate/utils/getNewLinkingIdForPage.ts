interface PageLinkingMap {
  oldLinkingId: string;
  newLinkingId: string;
}

/**
 * Gets the new linking ID for a page from the linking map
 *
 * Used when creating duplicated pages to assign the new linking ID
 * that corresponds to the original page's linking ID.
 *
 * @param oldLinkingId - The original page's linking ID
 * @param linkingMap - Map of old to new linking IDs
 * @returns New linking ID from the map, or original ID if not found, or null if no ID
 */
export const getNewLinkingIdForPage = (
  oldLinkingId: string | null,
  linkingMap: PageLinkingMap[]
): string | null => {
  if (!oldLinkingId) return null;

  const mapping = linkingMap.find(map => map.oldLinkingId === oldLinkingId);
  return mapping ? mapping.newLinkingId : oldLinkingId;
};
