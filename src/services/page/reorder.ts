import { getPrisma } from "../../lib/prisma";
import { updatePagesCacheAfterReorder } from "./cache-helpers";

export const reorderPages = async (
  funnelId: number,
  userId: number,
  pageOrders: { id: number; order: number }[]
): Promise<void> => {
  // Validate input
  if (!Array.isArray(pageOrders) || pageOrders.length === 0) {
    throw new Error("Page orders array is required and cannot be empty");
  }

  // Verify funnel belongs to user
  const funnel = await getPrisma().funnel.findFirst({
    where: {
      id: funnelId,
      userId,
    },
  });

  if (!funnel) {
    throw new Error("Funnel not found");
  }

  // Get all existing pages in the funnel
  const existingPages = await getPrisma().page.findMany({
    where: { funnelId },
    select: { id: true, order: true },
  });

  if (existingPages.length === 0) {
    throw new Error("No pages found in funnel");
  }

  // Validate that all provided page IDs exist in the funnel
  const existingPageIds = new Set(existingPages.map((page) => page.id));
  const providedPageIds = new Set(pageOrders.map((p) => p.id));

  for (const pageOrder of pageOrders) {
    if (!existingPageIds.has(pageOrder.id)) {
      throw new Error(`Page with ID ${pageOrder.id} not found in funnel`);
    }

    if (typeof pageOrder.order !== "number" || pageOrder.order < 1) {
      throw new Error(
        `Invalid order value ${pageOrder.order} for page ${pageOrder.id}. Order must be a positive number`
      );
    }
  }

  // Check if we're reordering all pages or just some
  if (providedPageIds.size !== existingPages.length) {
    throw new Error("Must provide order for all pages in the funnel");
  }

  // Check for duplicate order values
  const orderValues = pageOrders.map((p) => p.order);
  const uniqueOrders = new Set(orderValues);
  if (uniqueOrders.size !== orderValues.length) {
    throw new Error("Duplicate order values are not allowed");
  }

  // Update all page orders in a transaction
  await getPrisma().$transaction(
    pageOrders.map(({ id, order }) =>
      getPrisma().page.update({
        where: { id },
        data: { order },
      })
    )
  );

  // Update all relevant cache entries with new page orders
  await updatePagesCacheAfterReorder(userId, funnelId, pageOrders);
};