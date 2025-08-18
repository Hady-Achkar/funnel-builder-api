export const generateShortUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .replace(/^-+|-+$/g, ''); // Trim - from start and end
};

export const ensureUniqueSlug = async (prisma: any, baseSlug: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.template.findFirst({
      where: { slug }
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

export const replaceLinkingIdsInContent = (content: any, linkingIdMap: Map<string, string>): any => {
  if (typeof content === 'string') {
    let updatedContent = content;
    linkingIdMap.forEach((newId, oldId) => {
      updatedContent = updatedContent.replace(new RegExp(oldId, 'g'), newId);
    });
    return updatedContent;
  }
  
  if (typeof content === 'object' && content !== null) {
    if (Array.isArray(content)) {
      return content.map(item => replaceLinkingIdsInContent(item, linkingIdMap));
    } else {
      const updatedContent: any = {};
      for (const [key, value] of Object.entries(content)) {
        updatedContent[key] = replaceLinkingIdsInContent(value, linkingIdMap);
      }
      return updatedContent;
    }
  }
  
  return content;
};