import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import {
  ReorderPagesResponse,
  reorderPagesRequest,
  reorderPagesResponse,
} from "../../../types/page/reorder";
import { BadRequestError, UnauthorizedError, NotFoundError } from "../../../errors";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import { cacheService } from "../../cache/cache.service";

export const reorderPages = async (
  userId: number,
  requestBody: Record<string, unknown>
): Promise<ReorderPagesResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = reorderPagesRequest.parse(requestBody);
    const { funnelId, pageOrders } = validatedRequest;

    const prisma = getPrisma();

    // Get funnel with workspace info and existing pages
    const funnel = await prisma.funnel.findFirst({
      where: { id: funnelId },
      select: {
        id: true,
        workspaceId: true,
        pages: {
          select: { id: true, order: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!funnel) {
      throw new NotFoundError("Funnel not found");
    }

    if (funnel.pages.length === 0) {
      throw new NotFoundError("No pages found in this funnel");
    }

    // Check permission using PermissionManager
    await PermissionManager.requirePermission({
      userId,
      workspaceId: funnel.workspaceId,
      action: PermissionAction.REORDER_PAGE,
    });

    const { workspaceId, pages: existingPages } = funnel;

    // Validation: Ensure all provided page IDs exist in the funnel
    const existingPageIds = new Set(existingPages.map((page) => page.id));
    const providedPageIds = new Set(pageOrders.map((p) => p.id));

    for (const pageOrder of pageOrders) {
      if (!existingPageIds.has(pageOrder.id)) {
        throw new BadRequestError(
          `Page with ID ${pageOrder.id} not found in this funnel`
        );
      }
    }

    // Validation: Must provide order for all pages in the funnel
    if (providedPageIds.size !== existingPages.length) {
      throw new BadRequestError(
        "Must provide new order for all pages in the funnel"
      );
    }

    // Validation: Check for duplicate order values
    const orderValues = pageOrders.map((p) => p.order);
    const uniqueOrders = new Set(orderValues);
    if (uniqueOrders.size !== orderValues.length) {
      throw new BadRequestError("Duplicate order values are not allowed");
    }

    // Validation: Orders should be sequential starting from 1
    const sortedOrders = [...orderValues].sort((a, b) => a - b);
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i] !== i + 1) {
        throw new BadRequestError(
          "Order values must be sequential starting from 1"
        );
      }
    }

    // Update page orders in a transaction
    await prisma.$transaction(
      pageOrders.map(({ id, order }) =>
        prisma.page.update({
          where: { id },
          data: { order },
        })
      )
    );

    // Simplified cache invalidation - just delete the funnel cache
    await cacheService.del(
      `workspace:${workspaceId}:funnel:${funnelId}:full`
    );

    const response: ReorderPagesResponse = {
      message: "Pages reordered successfully",
    };

    return reorderPagesResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
