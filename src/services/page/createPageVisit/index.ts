import { getPrisma } from "../../../lib/prisma";
import { ZodError } from "zod";
import { BadRequestError, NotFoundError } from "../../../errors";
import {
  CreatePageVisitParams,
  CreatePageVisitRequest,
  CreatePageVisitResponse,
  createPageVisitParams,
  createPageVisitRequest,
  createPageVisitResponse,
} from "../../../types/page/createPageVisit";
import { cacheService } from "../../cache/cache.service";

export const createPageVisit = async (
  params: CreatePageVisitParams,
  requestBody: CreatePageVisitRequest
): Promise<CreatePageVisitResponse> => {
  try {
    const validatedParams = createPageVisitParams.parse(params);
    const validatedRequest = createPageVisitRequest.parse(requestBody);

    const { pageId } = validatedParams;
    const { sessionId } = validatedRequest;

    const prisma = getPrisma();

    // Validate page exists and funnel is LIVE
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
      const response = {
        message: "Visit tracking is only enabled for live funnels",
        isNewVisit: false,
      };
      return createPageVisitResponse.parse(response);
    }

    // Find or create session and record visit in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find or create session
      let session = await tx.session.findUnique({
        where: { sessionId },
        select: {
          id: true,
          visitedPages: true,
          funnelId: true,
        },
      });

      if (!session) {
        session = await tx.session.create({
          data: {
            sessionId,
            funnelId: page.funnelId,
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

      // Check if page already visited in this session
      if (session.visitedPages.includes(pageId)) {
        return {
          message: "Page visit already recorded for this session",
          isNewVisit: false,
        };
      }

      // Record visit
      await tx.session.update({
        where: { sessionId },
        data: {
          visitedPages: { push: pageId },
          updatedAt: new Date(),
        },
      });

      await tx.page.update({
        where: { id: pageId },
        data: { visits: { increment: 1 } },
      });

      return {
        message: "Page visit recorded successfully",
        isNewVisit: true,
      };
    });

    // Invalidate page cache after recording visit
    if (result.isNewVisit) {
      await cacheService.del(
        `workspace:${page.funnel.workspaceId}:funnel:${page.funnelId}:page:${pageId}:full`
      );
    }

    return createPageVisitResponse.parse(result);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};