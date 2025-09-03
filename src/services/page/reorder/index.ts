import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import {
  ReorderPagesResponse,
  reorderPagesRequest,
  reorderPagesResponse,
} from "../../../types/page/reorder";
import {
  checkReorderPermissions,
  updateCacheAfterReorder,
} from "../../../helpers/page/reorder";
import { BadRequestError, UnauthorizedError } from "../../../errors";

export const reorderPages = async (
  userId: number,
  requestBody: Record<string, unknown>
): Promise<ReorderPagesResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = reorderPagesRequest.parse(requestBody);
    const { funnelId, pageOrders } = validatedRequest;

    // Check permissions and get existing pages
    const permissionResult = await checkReorderPermissions(userId, funnelId);
    const { workspaceId, existingPages } = permissionResult;

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

    const prisma = getPrisma();

    // Update page orders in a transaction
    await prisma.$transaction(
      pageOrders.map(({ id, order }) =>
        prisma.page.update({
          where: { id },
          data: { order },
        })
      )
    );

    // Update cache
    await updateCacheAfterReorder({
      workspaceId,
      funnelId,
      pageOrders,
    });

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