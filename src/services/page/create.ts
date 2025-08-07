import { getPrisma } from "../../lib/prisma";
import { CreatePageRequest, CreatePageResponse, PageData } from "../../types/page.types";
import { generateLinkingId, generateUniquePageName, getNextPageOrder } from "./helpers";
import { cachePageData, updateFunnelDataCacheWithNewPage } from "./cache-helpers";

export const createPage = async (
  funnelId: number,
  userId: number,
  data: CreatePageRequest = {}
): Promise<CreatePageResponse> => {
  const funnel = await getPrisma().funnel.findFirst({
    where: {
      id: funnelId,
      userId,
    },
  });

  if (!funnel) {
    throw new Error("Funnel not found");
  }

  // Determine the order for the new page
  let order = data.order;
  if (order === undefined) {
    order = await getNextPageOrder(funnelId);
  }

  // Generate unique page name
  const pageName = data.name || await generateUniquePageName(funnelId);

  // Generate linking ID
  const linkingId = data.linkingId || generateLinkingId();

  const page = await getPrisma().page.create({
    data: {
      name: pageName,
      content: data.content || "",
      order,
      linkingId,
      funnelId,
    },
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

  // Cache the page data forever (no TTL)
  const pageData: PageData = {
    id: page.id,
    name: page.name,
    content: page.content,
    order: page.order,
    linkingId: page.linkingId,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    seoKeywords: page.seoKeywords,
    funnelId: page.funnelId,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  };

  // Cache the new page data
  await cachePageData(userId, pageData);

  // Update funnel cache with the new page instead of invalidating
  await updateFunnelDataCacheWithNewPage(userId, funnelId, {
    id: page.id,
    name: page.name,
    order: page.order,
    linkingId: page.linkingId,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    seoKeywords: page.seoKeywords,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  });

  return {
    id: page.id,
    name: page.name,
    linkingId: page.linkingId!,
    order: page.order,
    message: `Page "${page.name}" has been created successfully in your funnel`,
  };
};