import { getPrisma } from "../../../../lib/prisma";
import { HandlerResult } from "../../../../types/cron/addon-expiration.types";
import { AddOn, AddOnType } from "../../../../generated/prisma-client";
import { WorkspaceMemberAllocations } from "../../../../utils/allocations/workspace-member-allocations";

/**
 * Member Expiration Handler
 *
 * When EXTRA_ADMIN addon expires:
 * 1. Calculate allowed members based on active addons
 * 2. Get members (exclude owner, ORDER BY joinedAt DESC - newest first)
 * 3. Calculate excess members
 * 4. For excess members (starting from newest):
 *    - Delete workspaceMember record
 *
 * This removes excess team members, ensuring we never remove the workspace owner.
 */
export class MemberExpirationHandler {
  static async handle(addon: AddOn): Promise<HandlerResult> {
    const prisma = getPrisma();

    try {
      if (!addon.workspaceId) {
        return {
          success: false,
          resourcesAffected: {},
          error: "No workspace linked to this EXTRA_ADMIN addon",
        };
      }

      // Get workspace with plan type and owner
      const workspace = await prisma.workspace.findUnique({
        where: { id: addon.workspaceId },
        select: {
          id: true,
          planType: true,
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

      // Get all active EXTRA_ADMIN addons for this workspace (excluding the expired one)
      const activeAddons = await prisma.addOn.findMany({
        where: {
          workspaceId: addon.workspaceId,
          type: AddOnType.EXTRA_ADMIN,
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

      // Calculate allowed members
      const allowedMembers = WorkspaceMemberAllocations.calculateTotalAllocation({
        workspacePlanType: workspace.planType,
        addOns: activeAddons,
      });

      // Get current members (exclude owner, ORDER BY joinedAt DESC - newest first)
      const currentMembers = await prisma.workspaceMember.findMany({
        where: {
          workspaceId: addon.workspaceId,
          userId: { not: workspace.ownerId }, // Exclude owner
          status: "ACTIVE",
        },
        orderBy: { joinedAt: "desc" },
        select: {
          id: true,
          userId: true,
          joinedAt: true,
          role: true,
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      const currentCount = currentMembers.length;
      const excessCount = Math.max(0, currentCount - allowedMembers);

      if (excessCount === 0) {
        console.log(
          `[MemberHandler] No excess members to remove for workspace ${addon.workspaceId}`
        );
        return {
          success: true,
          resourcesAffected: {
            members: 0,
          },
          details: {
            workspaceId: addon.workspaceId,
            allowed: allowedMembers,
            current: currentCount,
            message: "No excess members to remove",
          },
        };
      }

      // Remove excess members (starting from newest)
      const membersToRemove = currentMembers.slice(0, excessCount);
      const memberIds = membersToRemove.map((m) => m.id);

      const result = await prisma.workspaceMember.deleteMany({
        where: { id: { in: memberIds } },
      });

      console.log(
        `[MemberHandler] ✅ Removed ${result.count} excess members from workspace ${addon.workspaceId}`
      );

      // Log details of removed members
      membersToRemove.forEach((member) => {
        console.log(
          `[MemberHandler]   - Removed: ${member.user?.email} (ID: ${member.userId}, role: ${member.role})`
        );
      });

      return {
        success: true,
        resourcesAffected: {
          members: result.count,
        },
        details: {
          workspaceId: addon.workspaceId,
          allowed: allowedMembers,
          current: currentCount,
          excess: excessCount,
          removed: result.count,
          removedMemberIds: membersToRemove.map((m) => m.userId),
          removedMembers: membersToRemove.map((m) => ({
            id: m.userId,
            email: m.user?.email,
            role: m.role,
          })),
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[MemberHandler] Failed to handle member addon ${addon.id}:`,
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
