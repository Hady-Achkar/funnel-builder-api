import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import {
  DuplicatePageResponse,
  duplicatePageRequest,
  duplicatePageResponse,
} from "../../../types/page/duplicate";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import { cacheService } from "../../cache/cache.service";
import { generateUniqueLinkingId } from "../../../utils/page-utils/linking-id";
import { FunnelPageAllocations } from "../../../utils/allocations/funnel-page-allocations";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager/permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";

export const duplicatePage = async (
  userId: number,
  requestBody: Record<string, unknown>
): Promise<DuplicatePageResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = duplicatePageRequest.parse(requestBody);
    const prisma = getPrisma();

    // Get source page with workspace info
    const sourcePage = await prisma.page.findUnique({
      where: { id: validatedRequest.pageId },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
        type: true,
        linkingId: true,
        funnelId: true,
        funnel: {
          select: {
            id: true,
            slug: true,
            workspaceId: true,
            workspace: {
              select: {
                id: true,
                slug: true,
                ownerId: true,
                planType: true,
                addOns: {
                  select: {
                    type: true,
                    quantity: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!sourcePage) {
      throw new NotFoundError("Page not found");
    }

    // Check VIEW permission on source page
    await PermissionManager.requirePermission({
      userId,
      workspaceId: sourcePage.funnel.workspaceId,
      action: PermissionAction.VIEW_PAGE,
    });

    // Determine target funnel
    const isSameFunnel =
      !validatedRequest.targetFunnelId ||
      validatedRequest.targetFunnelId === sourcePage.funnelId;

    let targetFunnel;
    let targetWorkspaceId: number;

    if (isSameFunnel) {
      targetFunnel = sourcePage.funnel;
      targetWorkspaceId = sourcePage.funnel.workspaceId;
    } else {
      // Get target funnel with workspace info
      const targetFunnelData = await prisma.funnel.findUnique({
        where: { id: validatedRequest.targetFunnelId },
        select: {
          id: true,
          slug: true,
          workspaceId: true,
          workspace: {
            select: {
              id: true,
              slug: true,
              ownerId: true,
              planType: true,
              addOns: {
                select: {
                  type: true,
                  quantity: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (!targetFunnelData) {
        throw new NotFoundError("Target funnel not found");
      }

      targetFunnel = targetFunnelData;
      targetWorkspaceId = targetFunnelData.workspaceId;
    }

    // Check CREATE_PAGE permission on target funnel
    await PermissionManager.requirePermission({
      userId,
      workspaceId: targetWorkspaceId,
      action: PermissionAction.CREATE_PAGE,
    });

    // Check page allocation limits for target funnel
    const currentPageCount = await prisma.page.count({
      where: { funnelId: targetFunnel.id },
    });

    const canCreate = FunnelPageAllocations.canCreatePage(currentPageCount, {
      workspacePlanType: targetFunnel.workspace.planType,
      addOns: targetFunnel.workspace.addOns,
    });

    if (!canCreate) {
      const summary = FunnelPageAllocations.getAllocationSummary(
        currentPageCount,
        {
          workspacePlanType: targetFunnel.workspace.planType,
          addOns: targetFunnel.workspace.addOns,
        }
      );

      throw new BadRequestError(
        `Target funnel has reached its page limit (${summary.totalAllocation} pages). ` +
          `It has ${summary.baseAllocation} base pages` +
          (summary.extraFromAddOns > 0
            ? ` + ${summary.extraFromAddOns} from add-ons. `
            : ". ") +
          `Upgrade your plan or purchase page add-ons to create more pages.`
      );
    }

    // Prepare new page name
    const newName = isSameFunnel
      ? `${sourcePage.name} (copy)`
      : sourcePage.name;

    // Generate unique linking ID
    const newLinkingId = await generateUniqueLinkingId(
      newName,
      targetFunnel.id
    );

    // Calculate order and handle reordering
    let newOrder: number;
    let reorderedPages: Array<{ id: number; order: number }> = [];

    if (isSameFunnel) {
      // Insert after source page
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
      // Add to end of target funnel
      const lastPage = await prisma.page.findFirst({
        where: { funnelId: targetFunnel.id },
        select: { order: true },
        orderBy: { order: "desc" },
      });

      newOrder = (lastPage?.order || 0) + 1;
    }

    // Create duplicate page in transaction
    const newPage = await prisma.$transaction(async (tx) => {
      // Reorder existing pages if needed
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

      // Create the duplicate page
      const created = await tx.page.create({
        data: {
          name: newName,
          content: sourcePage.content,
          order: newOrder,
          type: sourcePage.type,
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

    // Cache invalidation with slug-based keys
    try {
      const cacheKeysToInvalidate = [
        // Source funnel cache
        `workspace:${sourcePage.funnel.workspace.slug}:funnel:${sourcePage.funnel.slug}:full`,
        // All funnels cache for source workspace
        `workspace:${sourcePage.funnel.workspaceId}:funnels:all`,
      ];

      // If different funnel, also invalidate target funnel cache
      if (!isSameFunnel) {
        cacheKeysToInvalidate.push(
          `workspace:${targetFunnel.workspace.slug}:funnel:${targetFunnel.slug}:full`,
          `workspace:${targetWorkspaceId}:funnels:all`
        );
      }

      await Promise.all(
        cacheKeysToInvalidate.map((key) =>
          cacheService
            .del(key)
            .catch((err) =>
              console.warn(`Failed to invalidate cache key ${key}:`, err)
            )
        )
      );

      console.log(
        `[Cache] Invalidated caches for page duplication from page ${sourcePage.id}`
      );
    } catch (cacheError) {
      console.warn(
        "Cache invalidation failed but page was duplicated:",
        cacheError
      );
    }

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
