import { getPrisma } from "../../lib/prisma";
import { CreatePageVisitResponse } from "../../types/page.types";

export const createPageVisit = async (
  pageId: number,
  sessionId: string
): Promise<CreatePageVisitResponse> => {
  const prisma = getPrisma();

  // Use transaction to ensure data consistency
  const result = await prisma.$transaction(async (tx) => {
    // 1. Verify page exists and get funnel info
    const page = await tx.page.findUnique({
      where: { id: pageId },
      select: { id: true, funnelId: true }
    });

    if (!page) {
      throw new Error("Page not found");
    }

    // 2. Check if session exists
    let session = await tx.session.findUnique({
      where: { sessionId },
      select: { id: true, visitedPages: true }
    });

    // 3. If session doesn't exist, create it
    if (!session) {
      session = await tx.session.create({
        data: {
          sessionId,
          funnelId: page.funnelId,
          visitedPages: [],
          interactions: {}
        },
        select: { id: true, visitedPages: true }
      });
    }

    // 4. Check if page is already in visitedPages array
    if (session.visitedPages.includes(pageId)) {
      return {
        success: true,
        message: "Page visit already recorded for this session",
        isNewVisit: false
      };
    }

    // 5. Add page to visitedPages array and increment page visit counter
    await tx.session.update({
      where: { sessionId },
      data: {
        visitedPages: { push: pageId },
        updatedAt: new Date()
      }
    });

    await tx.page.update({
      where: { id: pageId },
      data: { visits: { increment: 1 } }
    });

    return {
      success: true,
      message: "New page visit recorded successfully",
      isNewVisit: true
    };
  });

  return {
    success: result.success,
    message: result.message
  };
};