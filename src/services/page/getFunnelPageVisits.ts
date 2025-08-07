import { getPrisma } from "../../lib/prisma";
import { PageVisitSummary, GetFunnelPageVisitsResponse } from "../../types/page.types";

export const getFunnelPageVisits = async (
  funnelId: number,
  userId: number
): Promise<GetFunnelPageVisitsResponse> => {
  // Verify funnel exists and belongs to user
  const funnel = await getPrisma().funnel.findFirst({
    where: {
      id: funnelId,
      userId,
    },
  });

  if (!funnel) {
    throw new Error("Funnel not found or you don't have access to it");
  }

  // Get all pages in the funnel with visit counts
  const pages = await getPrisma().page.findMany({
    where: {
      funnelId,
    },
    select: {
      id: true,
      name: true,
      linkingId: true,
      visits: true,
    },
    orderBy: {
      order: 'asc',
    },
  });

  const pageVisits: PageVisitSummary[] = pages.map(page => ({
    id: page.id,
    name: page.name,
    linkingId: page.linkingId,
    visits: page.visits,
  }));

  const totalVisits = pageVisits.reduce((sum, page) => sum + page.visits, 0);

  return {
    success: true,
    data: pageVisits,
    message: `Retrieved visit statistics for ${pages.length} pages with ${totalVisits} total visits`,
  };
};