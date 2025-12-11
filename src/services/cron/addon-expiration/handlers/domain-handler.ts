import { getPrisma } from "../../../../lib/prisma";
import { HandlerResult } from "../../../../types/cron/addon-expiration.types";
import { AddOn, AddOnType, DomainType } from "../../../../generated/prisma-client";
import { DeleteDomainService } from "../../../domain/delete/delete.service";
import { WorkspaceSubdomainAllocations } from "../../../../utils/allocations/workspace-subdomain-allocations";
import { WorkspaceCustomDomainAllocations } from "../../../../utils/allocations/workspace-custom-domain-allocations";

/**
 * Domain Expiration Handler
 *
 * When EXTRA_SUBDOMAIN or EXTRA_CUSTOM_DOMAIN addon expires:
 * 1. Calculate allowed domains based on active addons
 * 2. Get current domains (newest first)
 * 3. Calculate excess domains
 * 4. Delete excess domains using DeleteDomainService (handles Cloudflare cleanup)
 */
export class DomainExpirationHandler {
  static async handle(addon: AddOn): Promise<HandlerResult> {
    const prisma = getPrisma();

    try {
      if (!addon.workspaceId) {
        return {
          success: false,
          resourcesAffected: {},
          error: "No workspace linked to this domain addon",
        };
      }

      // Get workspace with plan type
      const workspace = await prisma.workspace.findUnique({
        where: { id: addon.workspaceId },
        select: {
          id: true,
          planType: true,
          isProtected: true,
          ownerId: true,
        },
      });

      if (!workspace) {
        return {
          success: false,
          resourcesAffected: {},
          error: `Workspace ${addon.workspaceId} not found`,
        };
      }

      // Determine domain type to process
      const domainType: DomainType =
        addon.type === AddOnType.EXTRA_SUBDOMAIN
          ? DomainType.SUBDOMAIN
          : DomainType.CUSTOM_DOMAIN;

      // Get all active addons for this workspace (excluding the expired one)
      const activeAddons = await prisma.addOn.findMany({
        where: {
          workspaceId: addon.workspaceId,
          type: addon.type,
          status: { in: ["ACTIVE", "CANCELLED"] },
          id: { not: addon.id }, // Exclude the currently expired addon
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

      // Calculate allowed domains
      let allowedDomains: number;
      if (domainType === DomainType.SUBDOMAIN) {
        allowedDomains = WorkspaceSubdomainAllocations.calculateTotalAllocation({
          workspacePlanType: workspace.planType,
          addOns: activeAddons,
        });
      } else {
        allowedDomains = WorkspaceCustomDomainAllocations.calculateTotalAllocation({
          workspacePlanType: workspace.planType,
          isProtected: workspace.isProtected,
          addOns: activeAddons,
        });
      }

      // Get current domains (ORDER BY createdAt DESC - newest first)
      const currentDomains = await prisma.domain.findMany({
        where: {
          workspaceId: addon.workspaceId,
          type: domainType,
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          hostname: true,
          createdAt: true,
        },
      });

      const currentCount = currentDomains.length;
      const excessCount = Math.max(0, currentCount - allowedDomains);

      if (excessCount === 0) {
        console.log(
          `[DomainHandler] No excess ${domainType} domains to delete for workspace ${addon.workspaceId}`
        );
        return {
          success: true,
          resourcesAffected: {
            domains: 0,
          },
          details: {
            workspaceId: addon.workspaceId,
            domainType,
            allowed: allowedDomains,
            current: currentCount,
            message: "No excess domains to delete",
          },
        };
      }

      // Delete excess domains (starting from newest)
      const domainsToDelete = currentDomains.slice(0, excessCount);
      const deletedDomainIds: number[] = [];
      const errors: string[] = [];

      for (const domain of domainsToDelete) {
        try {
          await DeleteDomainService.delete(workspace.ownerId, { id: domain.id });
          deletedDomainIds.push(domain.id);
          console.log(
            `[DomainHandler] ✅ Deleted ${domainType} ${domain.hostname} (ID: ${domain.id})`
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          errors.push(`Failed to delete domain ${domain.id}: ${errorMessage}`);
          console.error(
            `[DomainHandler] ❌ Failed to delete domain ${domain.id}:`,
            errorMessage
          );
        }
      }

      const successCount = deletedDomainIds.length;
      const failedCount = errors.length;

      console.log(
        `[DomainHandler] Deleted ${successCount}/${excessCount} excess ${domainType} domains for workspace ${addon.workspaceId}`
      );

      return {
        success: failedCount === 0,
        resourcesAffected: {
          domains: successCount,
        },
        details: {
          workspaceId: addon.workspaceId,
          domainType,
          allowed: allowedDomains,
          current: currentCount,
          excess: excessCount,
          deleted: successCount,
          failed: failedCount,
          deletedDomainIds,
          errors: errors.length > 0 ? errors : undefined,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[DomainHandler] Failed to handle domain addon ${addon.id}:`,
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
