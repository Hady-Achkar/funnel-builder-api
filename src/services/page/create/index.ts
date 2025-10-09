import {
  CreatePageResponse,
  createPageRequest,
  createPageResponse,
} from "../../../types/page/create";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../cache/cache.service";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import { ZodError } from "zod";
import { generateUniqueLinkingId } from "../../../utils/page-utils/linking-id";
import { FunnelPageAllocations } from "../../../utils/allocations/funnel-page-allocations";

export const createPage = async (
  userId: number,
  requestBody: Record<string, unknown>
): Promise<CreatePageResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = createPageRequest.parse(requestBody);

    const prisma = getPrisma();

    // Get funnel with workspace and addOns information
    const funnel = await prisma.funnel.findUnique({
      where: { id: validatedRequest.funnelId },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        workspace: {
          select: {
            id: true,
            name: true,
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

    if (!funnel) {
      throw new NotFoundError("Funnel not found");
    }

    if (!funnel.workspace) {
      throw new NotFoundError("Workspace not found for this funnel");
    }

    // Check page allocation limits
    const currentPageCount = await prisma.page.count({
      where: { funnelId: validatedRequest.funnelId },
    });

    const canCreate = FunnelPageAllocations.canCreatePage(currentPageCount, {
      workspacePlanType: funnel.workspace.planType,
      addOns: funnel.workspace.addOns,
    });

    if (!canCreate) {
      const summary = FunnelPageAllocations.getAllocationSummary(
        currentPageCount,
        {
          workspacePlanType: funnel.workspace.planType,
          addOns: funnel.workspace.addOns,
        }
      );

      throw new BadRequestError(
        `Your funnel has reached its page limit (${summary.totalAllocation} pages). ` +
          `You have ${summary.baseAllocation} base pages` +
          (summary.extraFromAddOns > 0
            ? ` + ${summary.extraFromAddOns} from add-ons. `
            : ". ") +
          `Upgrade your plan or purchase page add-ons to create more pages.`
      );
    }

    // Get the last page order
    const lastPage = await prisma.page.findFirst({
      where: { funnelId: validatedRequest.funnelId },
      select: { order: true },
      orderBy: { order: "desc" },
    });

    const newOrder = (lastPage?.order || 0) + 1;

    const pageName = validatedRequest.name || `Page ${newOrder}`;

    const linkingId = await generateUniqueLinkingId(
      pageName,
      validatedRequest.funnelId
    );

    const result = await prisma.$transaction(async (tx) => {
      const page = await tx.page.create({
        data: {
          name: pageName,
          content: validatedRequest.content || "",
          type: validatedRequest.type || "PAGE",
          funnelId: validatedRequest.funnelId,
          linkingId: linkingId,
          order: newOrder,
        },
      });

      return page;
    });

    // Simplified cache invalidation - just delete the funnel full cache
    try {
      await cacheService.del(
        `workspace:${funnel.workspace.id}:funnel:${validatedRequest.funnelId}:full`
      );
    } catch (cacheError) {
      console.warn(
        "Cache invalidation failed but page was created:",
        cacheError
      );
    }

    const response = {
      message: "Page created successfully",
      pageId: result.id,
    };

    return createPageResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
