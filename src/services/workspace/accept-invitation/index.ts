import { getPrisma } from "../../../lib/prisma";
import {
  AcceptInvitationRequest,
  AcceptInvitationResponse,
  InvitationTokenPayload,
} from "../../../types/workspace/accept-invitation";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../../../errors";
import jwt from "jsonwebtoken";
import { MembershipStatus } from "../../../generated/prisma-client";
import { cacheService } from "../../cache/cache.service";
import { WorkspaceMemberAllocations } from "../../../utils/allocations/workspace-member-allocations";

export class AcceptInvitationService {
  async acceptInvitation(
    userId: number,
    data: AcceptInvitationRequest
  ): Promise<AcceptInvitationResponse> {
    try {
      const prisma = getPrisma();

      let tokenPayload: InvitationTokenPayload;
      try {
        tokenPayload = jwt.verify(
          data.token,
          process.env.JWT_SECRET!
        ) as InvitationTokenPayload;
      } catch (error) {
        throw new BadRequestError("Invalid or expired invitation token");
      }

      if (tokenPayload.type !== "workspace_invitation") {
        throw new BadRequestError("Invalid invitation token type");
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true },
      });

      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Check if a pending invitation exists for the email in the token
      const pendingInvitation = await prisma.workspaceMember.findFirst({
        where: {
          email: tokenPayload.email,
          workspaceId: tokenPayload.workspaceId,
          status: MembershipStatus.PENDING,
        },
      });

      if (!pendingInvitation) {
        throw new ForbiddenError(
          "No pending invitation found for this email address. Please contact the workspace administrator."
        );
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: tokenPayload.workspaceId },
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
          planType: true,
          addOns: {
            where: { status: 'ACTIVE' },
            select: {
              type: true,
              quantity: true,
              status: true,
            },
          },
        },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      // Check member allocation limit before accepting invitation
      const currentMemberCount = await prisma.workspaceMember.count({
        where: {
          workspaceId: workspace.id,
          status: MembershipStatus.ACTIVE, // Only count ACTIVE members
        },
      });

      const canAddMember = WorkspaceMemberAllocations.canAddMember(
        currentMemberCount,
        {
          workspacePlanType: workspace.planType,
          addOns: workspace.addOns,
        }
      );

      if (!canAddMember) {
        throw new BadRequestError(
          "Cannot accept invitation. Workspace member limit has been reached. Please contact the workspace administrator to upgrade their plan."
        );
      }

      // Update the pending invitation to active
      const updatedMember = await prisma.workspaceMember.update({
        where: { id: pendingInvitation.id },
        data: {
          userId: user.id,
          status: MembershipStatus.ACTIVE,
          joinedAt: new Date(),
        },
      });

      // Invalidate workspace cache since member status changed
      try {
        await cacheService.del(`slug:${workspace.slug}`, { prefix: "workspace" });
        console.log(`[Cache] Invalidated workspace cache for ${workspace.slug} after invitation accepted`);
      } catch (cacheError) {
        console.error("Failed to invalidate workspace cache:", cacheError);
        // Don't fail the operation if cache invalidation fails
      }

      return {
        message: "Invitation accepted successfully",
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          role: updatedMember.role,
          permissions: updatedMember.permissions,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
