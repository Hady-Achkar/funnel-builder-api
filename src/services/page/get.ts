import { getPrisma } from "../../lib/prisma";
import { PageData, PageSummary, PublicPageData } from "../../types/page.types";
import { cacheService } from "../cache/cache.service";
import {
  getCachedPagesList,
  getCachedPage,
  cachePagesList,
  cachePageSummary,
  cachePageData,
} from "./cache-helpers";

export const getFunnelPages = async (
  funnelId: number,
  userId: number
): Promise<PageSummary[]> => {
  // Verify that the funnel exists and belongs to the user
  const funnel = await getPrisma().funnel.findFirst({
    where: {
      id: funnelId,
      userId,
    },
  });

  if (!funnel) {
    throw new Error("Funnel not found");
  }

  // Step 1: Check if pages list is in Redis cache
  const cachedPagesList = await getCachedPagesList(userId, funnelId);

  if (cachedPagesList) {
    // Verify all individual pages also exist in cache
    let allPagesInCache = true;
    for (const page of cachedPagesList) {
      const pageCache = await cacheService.get(`user:${userId}:page:${page.id}`);
      if (!pageCache) {
        allPagesInCache = false;
        break;
      }
    }

    if (allPagesInCache) {
      return cachedPagesList;
    }
  }

  // Step 2: If not all in cache, get from database
  const pages = await getPrisma().page.findMany({
    where: { funnelId },
    select: {
      id: true,
      name: true,
      order: true,
      linkingId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { order: "asc" },
  });

  // Step 3: Cache the pages list forever (no TTL)
  await cachePagesList(userId, funnelId, pages);

  // Also cache each individual page summary (without content)
  for (const page of pages) {
    await cachePageSummary(userId, page.id, page);
  }

  // Step 4: Return the pages (already sorted by order)
  return pages;
};

export const getPageById = async (
  pageId: number,
  userId: number
): Promise<PageData | null> => {
  // Step 1: Check if page is in Redis cache
  const cachedPage = await getCachedPage(userId, pageId);
  if (cachedPage) {
    return cachedPage;
  }

  // Step 2: If not in cache, get from database
  const page = await getPrisma().page.findFirst({
    where: {
      id: pageId,
      funnel: {
        userId,
      },
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

  if (!page) {
    return null;
  }

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

  // Step 3: Cache the full page data forever (no TTL)
  await cachePageData(userId, pageData);

  // Step 4: Return the page data
  return pageData;
};

export const getPageByLinkingId = async (
  funnelId: number,
  linkingId: string
): Promise<PublicPageData | null> => {
  // Step 1: First get from database to get the page ID for consistent caching
  const page = await getPrisma().page.findUnique({
    where: {
      funnelId_linkingId: {
        funnelId,
        linkingId,
      },
    },
    select: {
      id: true,
      name: true,
      content: true,
      linkingId: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      funnel: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  if (!page || !page.funnel) {
    return null;
  }

  if (page.funnel.status !== "LIVE") {
    return null;
  }

  // Cache key for public page data using pageId for consistency
  const cacheKey = `public:page:${page.id}`;

  // Step 2: Check if page is in Redis cache using pageId
  const cachedPage = await cacheService.get<PublicPageData>(cacheKey);
  if (cachedPage) {
    return cachedPage;
  }

  const publicPageData: PublicPageData = {
    id: page.id,
    name: page.name,
    content: page.content,
    linkingId: page.linkingId,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    seoKeywords: page.seoKeywords,
    funnelName: page.funnel.name,
    funnelId: page.funnel.id,
  };

  // Step 3: Cache the public page data forever (no TTL) using pageId
  await cacheService.set(cacheKey, publicPageData, { ttl: 0 });

  // Step 4: Return the public page data
  return publicPageData;
};