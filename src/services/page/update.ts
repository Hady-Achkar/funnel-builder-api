import { getPrisma } from "../../lib/prisma";
import { UpdatePageData, UpdatePageResponse } from "../../types/page.types";
import { cacheService } from "../cache/cache.service";
import { updateFunnelCachesWithUpdatedPage } from "./cache-helpers";

export const updatePage = async (
  pageId: number,
  userId: number,
  data: UpdatePageData
): Promise<UpdatePageResponse> => {
  const existingPage = await getPrisma().page.findFirst({
    where: {
      id: pageId,
      funnel: {
        userId,
      },
    },
    include: {
      funnel: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!existingPage) {
    throw new Error("Page not found");
  }

  // Track what fields are being updated
  const updatedFields: string[] = [];
  const updateData: UpdatePageData = {};

  // Check and validate each field
  if (data.name !== undefined && data.name !== existingPage.name) {
    updateData.name = data.name;
    updatedFields.push(`name "${data.name}"`);
  }

  if (data.content !== undefined && data.content !== existingPage.content) {
    updateData.content = data.content;
    updatedFields.push("content");
  }

  if (data.order !== undefined && data.order !== existingPage.order) {
    updateData.order = data.order;
    updatedFields.push(`order ${data.order}`);
  }

  if (data.linkingId !== undefined && data.linkingId !== existingPage.linkingId) {
    updateData.linkingId = data.linkingId;
    updatedFields.push(`linking ID "${data.linkingId}"`);
  }

  if (data.seoTitle !== undefined && data.seoTitle !== existingPage.seoTitle) {
    updateData.seoTitle = data.seoTitle;
    updatedFields.push("SEO title");
  }

  if (data.seoDescription !== undefined && data.seoDescription !== existingPage.seoDescription) {
    updateData.seoDescription = data.seoDescription;
    updatedFields.push("SEO description");
  }

  if (data.seoKeywords !== undefined && data.seoKeywords !== existingPage.seoKeywords) {
    updateData.seoKeywords = data.seoKeywords;
    updatedFields.push("SEO keywords");
  }

  // If no fields to update, return current data
  if (updatedFields.length === 0) {
    return {
      success: true,
      data: {
        id: existingPage.id,
        name: existingPage.name,
        content: existingPage.content,
        order: existingPage.order,
        linkingId: existingPage.linkingId,
        seoTitle: existingPage.seoTitle,
        seoDescription: existingPage.seoDescription,
        seoKeywords: existingPage.seoKeywords,
        funnelId: existingPage.funnelId,
        createdAt: existingPage.createdAt,
        updatedAt: existingPage.updatedAt,
      },
      message: "No changes were made to the page",
    };
  }

  // Update the page
  const updatedPage = await getPrisma().page.update({
    where: { id: pageId },
    data: updateData,
    select: {
      id: true,
      name: true,
      content: true,
      order: true,
      linkingId: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      funnelId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Update cached data
  const funnelId = existingPage.funnelId;
  const updatedPageData = {
    id: updatedPage.id,
    name: updatedPage.name,
    content: updatedPage.content,
    order: updatedPage.order,
    linkingId: updatedPage.linkingId,
    seoTitle: updatedPage.seoTitle,
    seoDescription: updatedPage.seoDescription,
    seoKeywords: updatedPage.seoKeywords,
    funnelId: updatedPage.funnelId,
    createdAt: updatedPage.createdAt,
    updatedAt: updatedPage.updatedAt,
  };

  // Update all relevant cache entries with the new data
  const cacheUpdates = [
    cacheService.set(`user:${userId}:page:${pageId}`, updatedPageData, { ttl: 0 }),
  ];

  // Handle linking ID cache updates
  if (existingPage.linkingId && updatedPage.linkingId !== existingPage.linkingId) {
    cacheUpdates.push(
      cacheService.del(`user:${userId}:funnel:${funnelId}:page:${existingPage.linkingId}`),
      cacheService.set(`user:${userId}:funnel:${funnelId}:page:${updatedPage.linkingId}`, updatedPageData, { ttl: 0 })
    );
  } else if (updatedPage.linkingId) {
    cacheUpdates.push(
      cacheService.set(`user:${userId}:funnel:${funnelId}:page:${updatedPage.linkingId}`, updatedPageData, { ttl: 0 })
    );
  }

  // Update page summary cache
  const pageSummaryData = {
    id: updatedPage.id,
    name: updatedPage.name,
    order: updatedPage.order,
    linkingId: updatedPage.linkingId,
    seoTitle: updatedPage.seoTitle,
    seoDescription: updatedPage.seoDescription,
    seoKeywords: updatedPage.seoKeywords,
    createdAt: updatedPage.createdAt,
    updatedAt: updatedPage.updatedAt,
  };
  cacheUpdates.push(
    cacheService.set(`user:${userId}:page:${pageId}:summary`, pageSummaryData, { ttl: 0 })
  );

  // Update all funnel caches (:pages, :full) with the updated page
  await updateFunnelCachesWithUpdatedPage(userId, funnelId, {
    id: updatedPage.id,
    name: updatedPage.name,
    order: updatedPage.order,
    linkingId: updatedPage.linkingId,
    seoTitle: updatedPage.seoTitle,
    seoDescription: updatedPage.seoDescription,
    seoKeywords: updatedPage.seoKeywords,
    createdAt: updatedPage.createdAt,
    updatedAt: updatedPage.updatedAt,
  });

  // Update public cache if the funnel is LIVE
  const funnel = await getPrisma().funnel.findUnique({
    where: { id: funnelId },
    select: { status: true, name: true },
  });

  if (funnel && funnel.status === "LIVE") {
    const publicPageData = {
      id: updatedPage.id,
      name: updatedPage.name,
      content: updatedPage.content,
      linkingId: updatedPage.linkingId,
      seoTitle: updatedPage.seoTitle,
      seoDescription: updatedPage.seoDescription,
      seoKeywords: updatedPage.seoKeywords,
      funnelName: funnel.name,
    };
    
    cacheUpdates.push(
      cacheService.set(`public:page:${pageId}`, publicPageData, { ttl: 0 })
    );
  } else {
    cacheUpdates.push(
      cacheService.del(`public:page:${pageId}`)
    );
  }

  // Execute all cache updates
  await Promise.all(cacheUpdates);

  // Generate user-friendly message
  let message: string;
  if (updatedFields.length === 1) {
    message = `Page ${updatedFields[0]} was updated successfully`;
  } else if (updatedFields.length === 2) {
    message = `Page ${updatedFields.join(" and ")} were updated successfully`;
  } else {
    const lastField = updatedFields.pop();
    message = `Page ${updatedFields.join(", ")}, and ${lastField} were updated successfully`;
  }

  return {
    success: true,
    data: updatedPage,
    message,
  };
};