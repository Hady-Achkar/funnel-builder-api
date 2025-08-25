import { BadRequestError } from "../../../errors";
import { getPrisma } from "../../../lib/prisma";

export const validateNameForLinkingId = (name: string): void => {
  const invalidChars = name.match(/[^a-zA-Z0-9\s\-_]/g);
  if (invalidChars) {
    throw new BadRequestError(
      `Page name contains invalid characters (${invalidChars.join(", ")}). Please use only letters, numbers, spaces, underscores, and hyphens.`
    );
  }
};

export const generateLinkingIdFromName = (name: string): string => {
  validateNameForLinkingId(name);
  
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

export const checkLinkingIdUniqueness = async (
  linkingId: string,
  funnelId: number,
  currentPageId: number
): Promise<void> => {
  const prisma = getPrisma();
  const existingPage = await prisma.page.findFirst({
    where: {
      linkingId,
      funnelId,
      id: { not: currentPageId },
    },
  });

  if (existingPage) {
    throw new BadRequestError(
      `A page with the linking ID "${linkingId}" already exists in this funnel. Please choose a different name.`
    );
  }
};

export const validatePageExists = async (pageId: number) => {
  const prisma = getPrisma();
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      funnel: {
        select: {
          id: true,
          workspaceId: true,
        },
      },
    },
  });

  if (!page) {
    throw new BadRequestError("Page not found");
  }

  return page;
};