import { getPrisma } from "../../lib/prisma";
import { cacheService } from "../cache/cache.service";
import { CreatePageVisitResponse } from "../../types/page.types";

export const createPageVisit = async (
  pageId: number,
  sessionId: string
): Promise<CreatePageVisitResponse> => {
  try {
    if (!pageId || !sessionId)
      throw new Error("Please provide pageId and sessionId.");

    const prisma = getPrisma();

    // Verify page exists and get funnel info
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { 
        id: true, 
        funnelId: true,
        funnel: { 
          select: { 
            userId: true,
            status: true 
          } 
        }
      }
    });

    if (!page) throw new Error("Page not found.");

    // Only track visits for LIVE funnels
    if (page.funnel.status !== "LIVE") {
      return {
        success: true,
        message: "Visit tracking is only enabled for live funnels"
      };
    }

    const userId = page.funnel.userId;
    const funnelId = page.funnelId;

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Check if session exists
      let session = await tx.session.findUnique({
        where: { sessionId },
        select: { id: true, visitedPages: true }
      });

      // If session doesn't exist, create it
      if (!session) {
        session = await tx.session.create({
          data: {
            sessionId,
            funnelId,
            visitedPages: [],
            interactions: {}
          },
          select: { id: true, visitedPages: true }
        });
      }

      // Check if page is already in visitedPages array
      if (session.visitedPages.includes(pageId)) {
        return {
          success: true,
          message: "Page visit already recorded for this session",
          isNewVisit: false
        };
      }

      // Add page to visitedPages array and increment page visit counter
      await tx.session.update({
        where: { sessionId },
        data: {
          visitedPages: { push: pageId },
          updatedAt: new Date()
        }
      });

      await tx.page.update({
        where: { id: pageId },
        data: { visits: { increment: 1 } }
      });

      return {
        success: true,
        message: "New page visit recorded successfully",
        isNewVisit: true
      };
    });

    // Update cache if it was a new visit
    if (result.isNewVisit) {
      try {
        // Update funnel:full cache using copy->delete->update->save pattern
        const funnelFullKey = `user:${userId}:funnel:${funnelId}:full`;
        const cachedFunnel = await cacheService.get<any>(funnelFullKey);
        
        if (cachedFunnel?.pages) {
          // Step 1: Copy the cached data
          const funnelDataCopy = { ...cachedFunnel };
          
          // Step 2: Delete the cache key
          await cacheService.del(funnelFullKey);
          
          // Step 3: Update the visit count for the specific page
          const pageIndex = funnelDataCopy.pages.findIndex((p: any) => p.id === pageId);
          if (pageIndex !== -1) {
            // Increment visits for the specific page
            const currentVisits = funnelDataCopy.pages[pageIndex].visits || 0;
            funnelDataCopy.pages[pageIndex] = {
              ...funnelDataCopy.pages[pageIndex],
              visits: currentVisits + 1,
              updatedAt: new Date()
            };
          }
          
          // Update funnel's updatedAt timestamp
          funnelDataCopy.updatedAt = new Date();
          
          // Step 4: Save the updated data back to cache
          await cacheService.set(funnelFullKey, funnelDataCopy, { ttl: 0 });
        }

        // Also update the page:full cache if it exists
        const pageFullKey = `user:${userId}:page:${pageId}:full`;
        const cachedPage = await cacheService.get<any>(pageFullKey);
        
        if (cachedPage) {
          const pageDataCopy = { ...cachedPage };
          await cacheService.del(pageFullKey);
          
          const currentVisits = pageDataCopy.visits || 0;
          pageDataCopy.visits = currentVisits + 1;
          pageDataCopy.updatedAt = new Date();
          
          await cacheService.set(pageFullKey, pageDataCopy, { ttl: 0 });
        }
      } catch (cacheError) {
        console.warn("Visit recorded, but cache couldn't be updated:", cacheError);
      }
    }

    return {
      success: result.success,
      message: result.message
    };
  } catch (e) {
    console.error("Failed to create page visit:", e);
    if (e instanceof Error) throw new Error(e.message);
    throw new Error("Couldn't record the page visit. Please try again.");
  }
};