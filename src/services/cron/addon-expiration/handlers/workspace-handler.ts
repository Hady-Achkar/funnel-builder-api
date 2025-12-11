import { getPrisma } from "../../../../lib/prisma";
import { HandlerResult } from "../../../../types/cron/addon-expiration.types";
import { AddOn, AddOnType } from "../../../../generated/prisma-client";
import { UserWorkspaceAllocations } from "../../../../utils/allocations/user-workspace-allocations";
import { cacheService } from "../../../cache/cache.service";

/**
 * Workspace Expiration Handler
 *
 * When EXTRA_WORKSPACE addon expires:
 * 1. Get the workspace linked to this addon (addon.workspaceId)
 * 2. Set workspace.status = SUSPENDED
 * 3. Get all funnels in that workspace
 * 4. Set all funnels.status = ARCHIVED
 *
 * This suspends the extra workspace and archives its content.
 */
export class WorkspaceExpirationHandler {
  static async handle(addon: AddOn): Promise<HandlerResult> {
    const prisma = getPrisma();

    try {
      // EXTRA_WORKSPACE addons are user-level, not linked to specific workspace
      // We need to find which workspace(s) to suspend using allocation system

      console.log(
        `[WorkspaceHandler] Processing EXTRA_WORKSPACE addon ${addon.id} for user ${addon.userId}`
      );

      // Get user's current plan and all their addons
      const user = await prisma.user.findUnique({
        where: { id: addon.userId },
        select: {
          plan: true,
          addOns: {
            select: {
              id: true,
              type: true,
              quantity: true,
              status: true,
              endDate: true,
            }
          }
        },
      });

      if (!user) {
        return {
          success: false,
          resourcesAffected: {},
          error: `User ${addon.userId} not found`,
        };
      }

      // Calculate allowed workspaces using allocation system
      // Exclude the current addon that's expiring from the calculation
      const activeAddons = user.addOns.filter(a => a.id !== addon.id);

      const allowedWorkspaces = UserWorkspaceAllocations.calculateTotalAllocation({
        plan: user.plan,
        addOns: activeAddons,
      });

      console.log(
        `[WorkspaceHandler] User plan: ${user.plan}, Allowed workspaces: ${allowedWorkspaces}`
      );

      // Get all user's active workspaces ordered by creation date (oldest first)
      const userWorkspaces = await prisma.workspace.findMany({
        where: {
          ownerId: addon.userId,
          status: { not: "SUSPENDED" }
        },
        orderBy: { createdAt: "asc" },
        select: { id: true, createdAt: true },
      });

      console.log(
        `[WorkspaceHandler] User has ${userWorkspaces.length} active workspaces`
      );

      // Calculate how many excess workspaces to suspend
      const excessCount = userWorkspaces.length - allowedWorkspaces;

      if (excessCount <= 0) {
        return {
          success: true,
          resourcesAffected: {
            workspaces: 0,
            funnels: 0,
          },
          details: {
            message: `No excess workspaces to suspend. User has ${userWorkspaces.length}, allowed ${allowedWorkspaces}`,
          },
        };
      }

      console.log(
        `[WorkspaceHandler] Will suspend ${excessCount} excess workspace(s) (newest ones)`
      );

      // Suspend the NEWEST workspaces (last ones created)
      // Reverse order to get newest first, then take the excess count
      const workspacesToSuspend = userWorkspaces.slice(-excessCount);

      console.log(
        `[WorkspaceHandler] Suspending workspace IDs: ${workspacesToSuspend.map(w => w.id).join(', ')}`
      );

      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        let totalFunnelsAffected = 0;

        // Process each workspace to suspend
        for (const ws of workspacesToSuspend) {
          // 1. Set workspace to SUSPENDED
          await tx.workspace.update({
            where: { id: ws.id },
            data: { status: "SUSPENDED" },
          });

          // 2. Archive all funnels in this workspace
          const funnelsUpdated = await tx.funnel.updateMany({
            where: {
              workspaceId: ws.id,
              status: { not: "ARCHIVED" },
            },
            data: { status: "ARCHIVED" },
          });

          totalFunnelsAffected += funnelsUpdated.count;

          console.log(
            `[WorkspaceHandler] ✅ Suspended workspace ${ws.id}: ${funnelsUpdated.count} funnels archived`
          );
        }

        return {
          workspacesAffected: workspacesToSuspend.length,
          funnelsAffected: totalFunnelsAffected,
        };
      });

      // Invalidate cache for all affected workspaces and their funnels
      try {
        const cacheInvalidationPromises = [];

        for (const ws of workspacesToSuspend) {
          // Invalidate workspace cache
          cacheInvalidationPromises.push(
            cacheService.invalidateWorkspaceCache(ws.id).catch(err =>
              console.warn(`[WorkspaceHandler] Failed to invalidate workspace cache for ${ws.id}:`, err)
            )
          );

          // Invalidate user workspaces list cache
          cacheInvalidationPromises.push(
            cacheService.invalidateUserWorkspacesCache(addon.userId).catch(err =>
              console.warn(`[WorkspaceHandler] Failed to invalidate user workspaces cache:`, err)
            )
          );

          // Invalidate all funnel caches in this workspace
          cacheInvalidationPromises.push(
            cacheService.del(`workspace:${ws.id}:funnels:all`).catch(err =>
              console.warn(`[WorkspaceHandler] Failed to invalidate funnels cache for workspace ${ws.id}:`, err)
            )
          );
        }

        await Promise.all(cacheInvalidationPromises);
        console.log(`[WorkspaceHandler] ✅ Cache invalidated for ${workspacesToSuspend.length} workspace(s)`);
      } catch (cacheError) {
        console.error("[WorkspaceHandler] Cache invalidation failed:", cacheError);
        // Don't fail the operation if cache invalidation fails
      }

      console.log(
        `[WorkspaceHandler] ✅ Total: ${result.workspacesAffected} workspace(s) suspended, ${result.funnelsAffected} funnel(s) archived`
      );

      return {
        success: true,
        resourcesAffected: {
          workspaces: result.workspacesAffected,
          funnels: result.funnelsAffected,
        },
        details: {
          workspaceIds: workspacesToSuspend.map(w => w.id),
          funnelsAffected: result.funnelsAffected,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[WorkspaceHandler] Failed to handle workspace addon ${addon.id}:`,
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
