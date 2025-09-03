import { getPrisma } from "../../../lib/prisma";
import { NotFoundError } from "../../../errors";

export const validatePageAndFunnelStatus = async (pageId: number) => {
  const prisma = getPrisma();
  
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    select: {
      id: true,
      funnelId: true,
      funnel: {
        select: {
          id: true,
          workspaceId: true,
          status: true,
        },
      },
    },
  });

  if (!page) {
    throw new NotFoundError("Page not found");
  }

  if (page.funnel.status !== "LIVE") {
    return {
      isLive: false,
      page,
      message: "Visit tracking is only enabled for live funnels",
    };
  }

  return {
    isLive: true,
    page,
    message: null,
  };
};