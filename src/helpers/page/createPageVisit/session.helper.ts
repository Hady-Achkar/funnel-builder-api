import { getPrisma } from "../../../lib/prisma";

export const findOrCreateSession = async (
  sessionId: string,
  funnelId: number
) => {
  const prisma = getPrisma();

  let session = await prisma.session.findUnique({
    where: { sessionId },
    select: { 
      id: true, 
      visitedPages: true,
      funnelId: true,
    },
  });

  if (!session) {
    session = await prisma.session.create({
      data: {
        sessionId,
        funnelId,
        visitedPages: [],
        interactions: {},
      },
      select: { 
        id: true, 
        visitedPages: true,
        funnelId: true,
      },
    });
  }

  return session;
};

export const isPageAlreadyVisited = (
  visitedPages: number[],
  pageId: number
): boolean => {
  return visitedPages.includes(pageId);
};