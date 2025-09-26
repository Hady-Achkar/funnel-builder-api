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
import { AllocationService } from "../../../utils/allocations";
import { MembershipStatus } from "../../../generated/prisma-client";

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

      if (user.email !== tokenPayload.email) {
        throw new ForbiddenError(
          "This invitation is not for your email address"
        );
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: tokenPayload.workspaceId },
        select: { id: true, name: true, slug: true, ownerId: true },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      // Find existing membership (could be PENDING or ACTIVE)
      const existingMember = await prisma.workspaceMember.findFirst({
        where: {
          email: user.email,
          workspaceId: workspace.id,
        },
        include: {
          workspace: {
            select: { name: true, slug: true },
          },
        },
      });

      if (existingMember) {
        // If already active, return success message
        if (existingMember.status === MembershipStatus.ACTIVE) {
          return {
            message: "Invitation already accepted",
            workspace: {
              id: workspace.id,
              name: workspace.name,
              slug: workspace.slug,
              role: existingMember.role,
              permissions: existingMember.permissions,
            },
          };
        }

        // If pending, update to active (no need to check allocation since user is already counted)
        if (existingMember.status === MembershipStatus.PENDING) {
          const updatedMember = await prisma.workspaceMember.update({
            where: { id: existingMember.id },
            data: {
              userId: user.id,
              status: MembershipStatus.ACTIVE,
              joinedAt: new Date(),
            },
          });

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
        }

        // If rejected, throw error
        if (existingMember.status === MembershipStatus.REJECTED) {
          throw new BadRequestError("This invitation has been rejected");
        }
      }

      // No pending invitation found
      throw new NotFoundError("No pending invitation found for this workspace");
    } catch (error) {
      throw error;
    }
  }
}
