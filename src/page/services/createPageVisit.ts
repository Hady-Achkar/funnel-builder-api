import { z } from "zod";
import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../../services/cache/cache.service";
import {
  CreatePageVisitParams,
  CreatePageVisitBody,
  CreatePageVisitResponse,
  CreatePageVisitParamsSchema,
  CreatePageVisitBodySchema,
  CreatePageVisitResponseSchema,
} from "../types";
import { CachedPage } from "../types/cached-page.types";

export const createPageVisit = async (
  params: CreatePageVisitParams,
  body: CreatePageVisitBody
): Promise<CreatePageVisitResponse> => {
  try {
    const validatedParams = CreatePageVisitParamsSchema.parse(params);
    const validatedBody = CreatePageVisitBodySchema.parse(body);

    const { pageId } = validatedParams;
    const { sessionId } = validatedBody;

    const prisma = getPrisma();

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: {
        id: true,
        funnelId: true,
        funnel: {
          select: {
            userId: true,
            status: true,
          },
        },
      },
    });

    if (!page) throw new Error("Page not found.");

    if (page.funnel.status !== "LIVE") {
      const response = {
        message: "Visit tracking is only enabled for live funnels",
      };
      CreatePageVisitResponseSchema.parse(response);
      return response;
    }

    const userId = page.funnel.userId;
    const funnelId = page.funnelId;

    const result = await prisma.$transaction(async (tx) => {
      let session = await tx.session.findUnique({
        where: { sessionId },
        select: { id: true, visitedPages: true },
      });

      if (!session) {
        session = await tx.session.create({
          data: {
            sessionId,
            funnelId,
            visitedPages: [],
            interactions: {},
          },
          select: { id: true, visitedPages: true },
        });
      }

      if (session.visitedPages.includes(pageId)) {
        return {
          success: true,
          message: "Page visit already recorded for this session",
          isNewVisit: false,
        };
      }

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
        success: true,
        message: "New page visit recorded successfully",
        isNewVisit: true,
      };
    });

    if (result.isNewVisit) {
      try {
        const funnelFullKey = `user:${userId}:funnel:${funnelId}:full`;
        const cachedFunnel = await cacheService.get<any>(funnelFullKey);

        if (cachedFunnel?.pages) {
          const funnelDataCopy = { ...cachedFunnel };
          await cacheService.del(funnelFullKey);
          const pageIndex = funnelDataCopy.pages.findIndex(
            (p) => p.id === pageId
          );
          if (pageIndex !== -1) {
            const currentVisits = funnelDataCopy.pages[pageIndex].visits || 0;
            funnelDataCopy.pages[pageIndex] = {
              ...funnelDataCopy.pages[pageIndex],
              visits: currentVisits + 1,
              updatedAt: new Date(),
            };
          }
          funnelDataCopy.updatedAt = new Date();
          await cacheService.set(funnelFullKey, funnelDataCopy, { ttl: 0 });
        }

        const pageFullKey = `user:${userId}:page:${pageId}:full`;
        const cachedPage = await cacheService.get<CachedPage>(pageFullKey);

        if (cachedPage) {
          const pageDataCopy = { ...cachedPage };
          await cacheService.del(pageFullKey);

          const currentVisits = pageDataCopy.visits || 0;
          pageDataCopy.visits = currentVisits + 1;
          pageDataCopy.updatedAt = new Date().toISOString();

          await cacheService.set(pageFullKey, pageDataCopy, { ttl: 0 });
        }
      } catch (cacheError) {
        console.warn(
          "Visit recorded, but cache couldn't be updated:",
          cacheError
        );
      }
    }

    const response = {
      message: result.message,
    };

    CreatePageVisitResponseSchema.parse(response);
    return response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw new Error(`Invalid input: ${firstError.message}`);
    }
    if (error instanceof Error) {
      throw new Error(`Page visit creation failed: ${error.message}`);
    }
    throw new Error("Couldn't record the page visit. Please try again.");
  }
};
