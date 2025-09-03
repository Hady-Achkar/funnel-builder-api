import { getPrisma } from "../../../lib/prisma";
import { ZodError } from "zod";
import { BadRequestError } from "../../../errors";
import {
  CreatePageVisitParams,
  CreatePageVisitRequest,
  CreatePageVisitResponse,
  createPageVisitParams,
  createPageVisitRequest,
  createPageVisitResponse,
} from "../../../types/page/createPageVisit";
import {
  validatePageAndFunnelStatus,
  findOrCreateSession,
  isPageAlreadyVisited,
  updatePageVisitCaches,
} from "../../../helpers/page/createPageVisit";

export const createPageVisit = async (
  params: CreatePageVisitParams,
  requestBody: CreatePageVisitRequest
): Promise<CreatePageVisitResponse> => {
  try {
    const validatedParams = createPageVisitParams.parse(params);
    const validatedRequest = createPageVisitRequest.parse(requestBody);

    const { pageId } = validatedParams;
    const { sessionId } = validatedRequest;

    const validationResult = await validatePageAndFunnelStatus(pageId);

    if (!validationResult.isLive) {
      const response = {
        message: validationResult.message!,
        isNewVisit: false,
      };
      return createPageVisitResponse.parse(response);
    }

    const { page } = validationResult;
    const prisma = getPrisma();

    const result = await prisma.$transaction(async (tx) => {
      const session = await findOrCreateSession(sessionId, page.funnelId);

      if (isPageAlreadyVisited(session.visitedPages, pageId)) {
        return {
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
        message: "Page visit recorded successfully",
        isNewVisit: true,
      };
    });

    if (result.isNewVisit) {
      await updatePageVisitCaches({
        pageId,
        funnelId: page.funnelId,
        workspaceId: page.funnel.workspaceId,
      });
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