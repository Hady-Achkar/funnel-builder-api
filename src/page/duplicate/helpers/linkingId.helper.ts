import { getPrisma } from "../../../lib/prisma";
import { createSlug } from "../../../utils/slug";

export const generateDuplicateLinkingId = async (
  pageName: string,
  originalLinkingId: string,
  targetFunnelId: number,
  isSameFunnel: boolean
): Promise<string> => {
  const prisma = getPrisma();
  
  // Base linkingId - for same funnel add -copy, for different funnel use original
  let baseLinkingId = isSameFunnel 
    ? `${originalLinkingId}-copy`
    : originalLinkingId;

  // Ensure the linkingId is properly slugified
  baseLinkingId = createSlug(baseLinkingId);
  
  let linkingId = baseLinkingId;
  let counter = 1;

  // Check if linkingId already exists and increment if needed
  while (true) {
    const existing = await prisma.page.findFirst({
      where: {
        funnelId: targetFunnelId,
        linkingId: linkingId,
      },
    });

    if (!existing) {
      break;
    }

    // If it exists, add or increment the counter
    if (counter === 1) {
      linkingId = `${baseLinkingId}-${counter + 1}`;
    } else {
      linkingId = `${baseLinkingId.replace(/-\d+$/, "")}-${counter + 1}`;
    }
    counter++;
  }

  return linkingId;
};