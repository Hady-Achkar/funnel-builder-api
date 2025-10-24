import { getPrisma } from "../../../../lib/prisma";
import { HandlerResult } from "../../../../types/cron/addon-expiration.types";
import { AddOn, AddOnType } from "../../../../generated/prisma-client";
import { FunnelPageAllocations } from "../../../../utils/allocations/funnel-page-allocations";

/**
 * Page Expiration Handler
 *
 * When EXTRA_PAGE addon expires:
 * 1. Get workspace from addon.workspaceId
 * 2. For each funnel in workspace:
 *    a. Calculate allowed pages based on active addons
 *    b. Get pages in funnel (ORDER BY createdAt ASC - keep oldest)
 *    c. For excess pages (starting from newest):
 *       - Set page.linkingId = null
 *
 * This removes the linking IDs from excess pages, effectively disabling them.
 */
export class PageExpirationHandler {
  static async handle(addon: AddOn): Promise<HandlerResult> {
    const prisma = getPrisma();

    try {
      if (!addon.workspaceId) {
        return {
          success: false,
          resourcesAffected: {},
          error: "No workspace linked to this EXTRA_PAGE addon",
        };
      }

      // Get workspace with plan type
      const workspace = await prisma.workspace.findUnique({
        where: { id: addon.workspaceId },
        select: {
          id: true,
          planType: true,
        },
      });

      if (!workspace) {
        return {
          success: false,
          resourcesAffected: {},
          error: `Workspace ${addon.workspaceId} not found`,
        };
      }

      // Get all active EXTRA_PAGE addons for this workspace (excluding the expired one)
      const activeAddons = await prisma.addOn.findMany({
        where: {
          workspaceId: addon.workspaceId,
          type: AddOnType.EXTRA_PAGE,
          status: { in: ["ACTIVE", "CANCELLED"] },
          id: { not: addon.id },
          OR: [
            { endDate: null },
            { endDate: { gt: new Date() } },
          ],
        },
        select: {
          type: true,
          quantity: true,
          status: true,
          endDate: true,
        },
      });

      // Calculate allowed pages per funnel
      const allowedPagesPerFunnel = FunnelPageAllocations.calculateTotalAllocation({
        workspacePlanType: workspace.planType,
        addOns: activeAddons,
      });

      // Get all funnels in workspace
      const funnels = await prisma.funnel.findMany({
        where: { workspaceId: addon.workspaceId },
        select: { id: true, name: true },
      });

      if (funnels.length === 0) {
        console.log(
          `[PageHandler] No funnels in workspace ${addon.workspaceId}`
        );
        return {
          success: true,
          resourcesAffected: {
            pages: 0,
          },
          details: {
            workspaceId: addon.workspaceId,
            message: "No funnels to process",
          },
        };
      }

      let totalPagesCleared = 0;
      const funnelDetails: Array<{
        funnelId: number;
        funnelName: string;
        pagesCleared: number;
      }> = [];

      // Process each funnel
      for (const funnel of funnels) {
        // Get pages in this funnel (ORDER BY createdAt ASC - keep oldest first)
        const pages = await prisma.page.findMany({
          where: {
            funnelId: funnel.id,
            linkingId: { not: null }, // Only pages with linkingId
          },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            linkingId: true,
            createdAt: true,
          },
        });

        const currentPagesWithLinking = pages.length;
        const excessPages = Math.max(
          0,
          currentPagesWithLinking - allowedPagesPerFunnel
        );

        if (excessPages === 0) {
          continue; // No excess pages in this funnel
        }

        // Get the excess pages (newest ones - from the end of the array)
        const pagesToClear = pages.slice(-excessPages);

        // Clear linkingId for excess pages
        const pageIds = pagesToClear.map((p) => p.id);
        const result = await prisma.page.updateMany({
          where: { id: { in: pageIds } },
          data: { linkingId: null },
        });

        totalPagesCleared += result.count;
        funnelDetails.push({
          funnelId: funnel.id,
          funnelName: funnel.name,
          pagesCleared: result.count,
        });

        console.log(
          `[PageHandler] ✅ Cleared linkingId for ${result.count} pages in funnel ${funnel.name} (ID: ${funnel.id})`
        );
      }

      console.log(
        `[PageHandler] Total pages cleared: ${totalPagesCleared} across ${funnelDetails.length} funnels in workspace ${addon.workspaceId}`
      );

      return {
        success: true,
        resourcesAffected: {
          pages: totalPagesCleared,
        },
        details: {
          workspaceId: addon.workspaceId,
          allowedPagesPerFunnel,
          funnelsProcessed: funnels.length,
          funnelsAffected: funnelDetails.length,
          funnelDetails,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[PageHandler] Failed to handle page addon ${addon.id}:`,
        errorMessage
      );

      return {
        success: false,
        resourcesAffected: {},
        error: errorMessage,
      };
    }
  }
}
