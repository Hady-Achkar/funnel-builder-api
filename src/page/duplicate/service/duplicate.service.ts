import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import {
  DuplicatePageResponse,
  duplicatePageRequest,
  duplicatePageResponse,
} from "../types";
import {
  checkDuplicatePermissions,
  generateDuplicateLinkingId,
  updateCacheAfterDuplicate,
} from "../helpers";
import { BadRequestError, UnauthorizedError } from "../../../errors";

export const duplicatePage = async (
  userId: number,
  requestBody: Record<string, unknown>
): Promise<DuplicatePageResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = duplicatePageRequest.parse(requestBody);

    const permissionResult = await checkDuplicatePermissions(
      userId,
      validatedRequest.pageId,
      validatedRequest.targetFunnelId
    );

    const { sourcePage, targetFunnel, isSameFunnel } = permissionResult;
    const prisma = getPrisma();

    const newLinkingId = await generateDuplicateLinkingId(
      sourcePage.name,
      sourcePage.linkingId,
      targetFunnel.id,
      isSameFunnel
    );

    const newName = isSameFunnel
      ? `${sourcePage.name} (copy)`
      : sourcePage.name;

    let newOrder: number;
    let reorderedPages: Array<{ id: number; order: number }> = [];

    if (isSameFunnel) {
      newOrder = sourcePage.order + 1;

      const pagesToReorder = await prisma.page.findMany({
        where: {
          funnelId: targetFunnel.id,
          order: { gt: sourcePage.order },
        },
        select: { id: true, order: true },
        orderBy: { order: "asc" },
      });

      reorderedPages = pagesToReorder.map((page) => ({
        id: page.id,
        order: page.order + 1,
      }));
    } else {
      const lastPage = await prisma.page.findFirst({
        where: { funnelId: targetFunnel.id },
        select: { order: true },
        orderBy: { order: "desc" },
      });

      newOrder = (lastPage?.order || 0) + 1;
    }

    const newPage = await prisma.$transaction(async (tx) => {
      if (isSameFunnel && reorderedPages.length > 0) {
        await Promise.all(
          reorderedPages.map((page) =>
            tx.page.update({
              where: { id: page.id },
              data: { order: page.order },
            })
          )
        );
      }

      const created = await tx.page.create({
        data: {
          name: newName,
          content: sourcePage.content,
          order: newOrder,
          linkingId: newLinkingId,
          funnelId: targetFunnel.id,
          seoTitle: null,
          seoDescription: null,
          seoKeywords: null,
          visits: 0,
        },
      });

      return created;
    });

    await updateCacheAfterDuplicate({
      workspaceId: targetFunnel.workspaceId,
      funnelId: targetFunnel.id,
      newPage: {
        id: newPage.id,
        name: newPage.name,
        content: newPage.content,
        order: newPage.order,
        linkingId: newPage.linkingId,
        seoTitle: newPage.seoTitle,
        seoDescription: newPage.seoDescription,
        seoKeywords: newPage.seoKeywords,
        funnelId: newPage.funnelId,
        visits: newPage.visits,
        createdAt: newPage.createdAt,
        updatedAt: newPage.updatedAt,
      },
      reorderedPages,
    });

    const response: DuplicatePageResponse = {
      message: "Page duplicated successfully",
      pageId: newPage.id,
    };

    return duplicatePageResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
