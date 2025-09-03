import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../cache/cache.service";
import {
  UpdatePageParamsInput,
  updatePageParams,
  updatePageRequest,
  UpdatePageRequest,
  UpdatePageResponse,
} from "../../../types/page/update";
import {
  validatePageExists,
  generateLinkingIdFromName,
  checkLinkingIdUniqueness,
} from "../../../helpers/page/update";
import { checkFunnelEditPermissions } from "../../../helpers/page/create";

export const updatePage = async (
  params: UpdatePageParamsInput,
  requestData: UpdatePageRequest,
  userId: number
): Promise<UpdatePageResponse> => {
  const validatedParams = updatePageParams.parse(params);
  const validatedData = updatePageRequest.parse(requestData);

  const prisma = getPrisma();
  const existingPage = await validatePageExists(validatedParams.id);

  await checkFunnelEditPermissions(userId, existingPage.funnelId);

  const updateData: any = {};
  let newLinkingId: string | undefined;

  // Handle linkingId logic
  if (validatedData.linkingId !== undefined) {
    // Use provided linkingId directly (already validated by Zod)
    await checkLinkingIdUniqueness(
      validatedData.linkingId,
      existingPage.funnelId,
      existingPage.id
    );
    newLinkingId = validatedData.linkingId;
    updateData.linkingId = newLinkingId;
  } else if (validatedData.name !== undefined) {
    // Generate linkingId from name when name is updated but linkingId not provided
    newLinkingId = generateLinkingIdFromName(validatedData.name);
    await checkLinkingIdUniqueness(
      newLinkingId,
      existingPage.funnelId,
      existingPage.id
    );
    updateData.linkingId = newLinkingId;
  }

  if (validatedData.name !== undefined) {
    updateData.name = validatedData.name;
  }

  if (validatedData.content !== undefined) {
    updateData.content = validatedData.content;
  }

  if (validatedData.seoTitle !== undefined) {
    updateData.seoTitle = validatedData.seoTitle;
  }

  if (validatedData.seoDescription !== undefined) {
    updateData.seoDescription = validatedData.seoDescription;
  }

  if (validatedData.seoKeywords !== undefined) {
    updateData.seoKeywords = validatedData.seoKeywords;
  }

  if (validatedData.type !== undefined) {
    updateData.type = validatedData.type;
  }

  if (Object.keys(updateData).length === 0) {
    return {
      message: "No changes provided",
      page: {
        id: existingPage.id,
        name: existingPage.name,
        content: existingPage.content,
        order: existingPage.order,
        type: existingPage.type,
        linkingId: existingPage.linkingId,
        seoTitle: existingPage.seoTitle,
        seoDescription: existingPage.seoDescription,
        seoKeywords: existingPage.seoKeywords,
        funnelId: existingPage.funnelId,
        createdAt: existingPage.createdAt,
        updatedAt: existingPage.updatedAt,
      },
    };
  }

  const updatedPage = await prisma.page.update({
    where: { id: existingPage.id },
    data: updateData,
  });

  const pageCacheKey = `funnel:${existingPage.funnelId}:page:${existingPage.id}:full`;
  const funnelCacheKey = `workspace:${existingPage.funnel.workspaceId}:funnel:${existingPage.funnelId}:full`;

  // Get existing funnel cache to update it
  let funnelCache = await cacheService.get<any>(funnelCacheKey);
  if (funnelCache && funnelCache.pages) {
    // Update the specific page in the funnel cache
    const pageIndex = funnelCache.pages.findIndex((p: any) => p.id === existingPage.id);
    if (pageIndex !== -1) {
      // Update the page data in funnel cache (without content to keep it lightweight)
      funnelCache.pages[pageIndex] = {
        ...updatedPage,
        content: undefined, // Don't store content in funnel cache
      };
    }
  }

  const cacheUpdates = [
    cacheService.set(pageCacheKey, updatedPage, { ttl: 0 }),
    funnelCache ? cacheService.set(funnelCacheKey, funnelCache, { ttl: 0 }) : Promise.resolve(),
  ];

  await Promise.all(cacheUpdates);

  return {
    message: "Page updated successfully",
    page: {
      id: updatedPage.id,
      name: updatedPage.name,
      content: updatedPage.content,
      order: updatedPage.order,
      type: updatedPage.type,
      linkingId: updatedPage.linkingId,
      seoTitle: updatedPage.seoTitle,
      seoDescription: updatedPage.seoDescription,
      seoKeywords: updatedPage.seoKeywords,
      funnelId: updatedPage.funnelId,
      createdAt: updatedPage.createdAt,
      updatedAt: updatedPage.updatedAt,
    },
  };
};