import { getPrisma } from "../../../../lib/prisma";
import { HandlerResult } from "../../../../types/cron/addon-expiration.types";
import { AddOn, AddOnType } from "../../../../generated/prisma-client";
import { WorkspaceFunnelAllocations } from "../../../../utils/allocations/workspace-funnel-allocations";
import { cacheService } from "../../../cache/cache.service";

/**
 * Funnel Expiration Handler
 *
 * When EXTRA_FUNNEL addon expires:
 * 1. Calculate allowed funnels based on active addons
 * 2. Get all funnels (ORDER BY createdAt DESC - newest first)
 * 3. Calculate excess funnels
 * 4. For excess funnels (starting from newest):
 *    - Set funnel.status = ARCHIVED
 *
 * This archives only the excess funnels beyond the allowed limit.
 */
export class FunnelExpirationHandler {
  static async handle(addon: AddOn): Promise<HandlerResult> {
    const prisma = getPrisma();

    try {
      if (!addon.workspaceId) {
        return {
          success: false,
          resourcesAffected: {},
          error: "No workspace linked to this EXTRA_FUNNEL addon",
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

      // Get all active EXTRA_FUNNEL addons for this workspace (excluding the expired one)
      const activeAddons = await prisma.addOn.findMany({
        where: {
          workspaceId: addon.workspaceId,
          type: AddOnType.EXTRA_FUNNEL,
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

      // Calculate allowed funnels
      const allowedFunnels = WorkspaceFunnelAllocations.calculateTotalAllocation({
        workspacePlanType: workspace.planType,
        addOns: activeAddons,
      });

      // Get current funnels (ORDER BY createdAt DESC - newest first)
      // Exclude already ARCHIVED funnels
      const currentFunnels = await prisma.funnel.findMany({
        where: {
          workspaceId: addon.workspaceId,
          status: { not: "ARCHIVED" },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
        },
      });

      const currentCount = currentFunnels.length;
      const excessCount = Math.max(0, currentCount - allowedFunnels);

      if (excessCount === 0) {
        console.log(
          `[FunnelHandler] No excess funnels to archive for workspace ${addon.workspaceId}`
        );
        return {
          success: true,
          resourcesAffected: {
            funnels: 0,
          },
          details: {
            workspaceId: addon.workspaceId,
            allowed: allowedFunnels,
            current: currentCount,
            message: "No excess funnels to archive",
          },
        };
      }

      // Archive excess funnels (starting from newest)
      const funnelsToArchive = currentFunnels.slice(0, excessCount);
      const funnelIds = funnelsToArchive.map((f) => f.id);

      const result = await prisma.funnel.updateMany({
        where: { id: { in: funnelIds } },
        data: { status: "ARCHIVED" },
      });

      console.log(
        `[FunnelHandler] ✅ Archived ${result.count} excess funnels for workspace ${addon.workspaceId}`
      );

      // Log details of archived funnels
      funnelsToArchive.forEach((funnel) => {
        console.log(
          `[FunnelHandler]   - Archived: ${funnel.name} (ID: ${funnel.id}, previous status: ${funnel.status})`
        );
      });

      // Invalidate cache for all affected funnels and workspace
      try {
        const cacheInvalidationPromises = [];

        // Invalidate workspace funnels list cache
        cacheInvalidationPromises.push(
          cacheService.del(`workspace:${addon.workspaceId}:funnels:all`).catch(err =>
            console.warn(`[FunnelHandler] Failed to invalidate funnels list cache:`, err)
          )
        );

        // Invalidate each individual funnel cache
        for (const funnelId of funnelIds) {
          cacheInvalidationPromises.push(
            cacheService.invalidateFunnelCache(funnelId).catch(err =>
              console.warn(`[FunnelHandler] Failed to invalidate funnel cache for ${funnelId}:`, err)
            )
          );
        }

        await Promise.all(cacheInvalidationPromises);
        console.log(`[FunnelHandler] ✅ Cache invalidated for ${funnelIds.length} funnel(s)`);
      } catch (cacheError) {
        console.error("[FunnelHandler] Cache invalidation failed:", cacheError);
        // Don't fail the operation if cache invalidation fails
      }

      return {
        success: true,
        resourcesAffected: {
          funnels: result.count,
        },
        details: {
          workspaceId: addon.workspaceId,
          allowed: allowedFunnels,
          current: currentCount,
          excess: excessCount,
          archived: result.count,
          archivedFunnelIds: funnelIds,
          archivedFunnels: funnelsToArchive.map((f) => ({
            id: f.id,
            name: f.name,
            previousStatus: f.status,
          })),
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[FunnelHandler] Failed to handle funnel addon ${addon.id}:`,
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
