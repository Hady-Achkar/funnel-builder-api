import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import {
  DeletePageResponse,
  deletePageRequest,
  deletePageResponse,
} from "../../../types/page/delete";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../../errors";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import { cacheService } from "../../cache/cache.service";

export const deletePage = async (
  userId: number,
  requestBody: Record<string, unknown>
): Promise<DeletePageResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = deletePageRequest.parse(requestBody);

    const prisma = getPrisma();

    // Get page with funnel and workspace information
    const page = await prisma.page.findFirst({
      where: { id: validatedRequest.pageId },
      select: {
        id: true,
        funnelId: true,
        order: true,
        funnel: {
          select: {
            id: true,
            workspaceId: true,
          },
        },
      },
    });

    if (!page) {
      throw new NotFoundError("Page not found");
    }

    // Check permission using PermissionManager
    await PermissionManager.requirePermission({
      userId,
      workspaceId: page.funnel.workspaceId,
      action: PermissionAction.DELETE_PAGE,
    });

    // Check if this is the last page in the funnel
    const pageCount = await prisma.page.count({
      where: { funnelId: page.funnelId },
    });

    if (pageCount <= 1) {
      throw new BadRequestError(
        "Cannot delete the last page in a funnel. Every funnel must have at least one page."
      );
    }

    // Delete page and reorder remaining pages in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.page.delete({
        where: { id: validatedRequest.pageId },
      });

      const pagesToReorder = await tx.page.findMany({
        where: {
          funnelId: page.funnelId,
          order: { gt: page.order },
        },
        orderBy: { order: "asc" },
      });

      if (pagesToReorder.length > 0) {
        await Promise.all(
          pagesToReorder.map((p) =>
            tx.page.update({
              where: { id: p.id },
              data: { order: p.order - 1 },
            })
          )
        );
      }
    });

    // Invalidate funnel cache
    await cacheService.del(
      `workspace:${page.funnel.workspaceId}:funnel:${page.funnelId}:full`
    );

    const response: DeletePageResponse = {
      message: "Page deleted successfully",
    };

    return deletePageResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};