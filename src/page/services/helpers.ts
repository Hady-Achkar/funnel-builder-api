import { getPrisma } from "../../lib/prisma";

export const generateLinkingId = (): string => {
  const timestamp = Date.now().toString(36); // Current timestamp in base36
  const randomPart = Math.random().toString(36).substring(2, 8); // 6 random characters
  return `${timestamp}-${randomPart}`;
};

export const verifyPageAccess = async (
  pageId: number,
  userId: number
): Promise<boolean> => {
  const page = await getPrisma().page.findFirst({
    where: {
      id: pageId,
      funnel: {
        createdBy: userId,
      },
    },
    select: { id: true },
  });

  return !!page;
};

export const verifyFunnelAccess = async (
  funnelId: number,
  userId: number
): Promise<boolean> => {
  const funnel = await getPrisma().funnel.findFirst({
    where: {
      id: funnelId,
      createdBy: userId,
    },
    select: { id: true },
  });

  return !!funnel;
};

export const getNextPageOrder = async (funnelId: number): Promise<number> => {
  const lastPage = await getPrisma().page.findFirst({
    where: { funnelId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return lastPage ? lastPage.order + 1 : 1;
};

export const generateUniquePageName = async (
  funnelId: number,
  baseName?: string
): Promise<string> => {
  const existingPages = await getPrisma().page.findMany({
    where: { funnelId },
    select: { name: true },
  });

  const existingNames = existingPages.map((page) => page.name);

  if (baseName && !existingNames.includes(baseName)) {
    return baseName;
  }

  let pageNumber = 1;
  while (existingNames.includes(`Page ${pageNumber}`)) {
    pageNumber++;
  }

  return `Page ${pageNumber}`;
};
