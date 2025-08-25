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

export const getNewLinkingIdForPage = (
  oldLinkingId: string | null,
  linkingMap: PageLinkingMap[]
): string | null => {
  if (!oldLinkingId) return null;
  
  const mapping = linkingMap.find(map => map.oldLinkingId === oldLinkingId);
  return mapping ? mapping.newLinkingId : oldLinkingId;
};