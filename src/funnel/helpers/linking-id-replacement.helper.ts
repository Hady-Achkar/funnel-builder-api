interface PageLinkingMap {
  oldLinkingId: string;
  newLinkingId: string;
}

const generateShortId = (): string => {
  // Generate a short 8-character ID using alphanumeric characters
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateLinkingIdMap = (templatePages: Array<{ linkingId: string | null }>): PageLinkingMap[] => {
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

export const replaceLinkingIdsInContent = (
  content: string | null,
  linkingMap: PageLinkingMap[]
): string | null => {
  if (!content) return content;
  
  let updatedContent = content;
  
  linkingMap.forEach(({ oldLinkingId, newLinkingId }) => {
    // Escape special regex characters in the linking ID
    const escapedOldId = oldLinkingId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Simple global replacement of the linking ID wherever it appears
    // This will replace all occurrences of the exact linking ID string
    const globalPattern = new RegExp(escapedOldId, 'g');
    updatedContent = updatedContent.replace(globalPattern, newLinkingId);
  });
  
  return updatedContent;
};

export const getNewLinkingIdForPage = (
  oldLinkingId: string | null,
  linkingMap: PageLinkingMap[]
): string | null => {
  if (!oldLinkingId) return null;
  
  const mapping = linkingMap.find(map => map.oldLinkingId === oldLinkingId);
  return mapping ? mapping.newLinkingId : oldLinkingId;
};