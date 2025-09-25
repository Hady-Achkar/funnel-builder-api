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

      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId: workspace.id,
          },
        },
        include: {
          workspace: {
            select: { name: true, slug: true },
          },
        },
      });

      if (existingMember) {
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

      const canAddMember = await AllocationService.canAddMember(
        workspace.ownerId,
        workspace.id
      );
      if (!canAddMember) {
        throw new BadRequestError(
          "Cannot accept invitation. Workspace member limit reached."
        );
      }

      const rolePermTemplate =
        await prisma.workspaceRolePermTemplate.findUnique({
          where: {
            workspaceId_role: {
              workspaceId: workspace.id,
              role: tokenPayload.role as any,
            },
          },
        });

      const permissions = rolePermTemplate?.permissions || [];

      const newMember = await prisma.workspaceMember.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: tokenPayload.role as any,
          permissions: permissions,
        },
      });

      return {
        message: "Invitation accepted successfully",
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          role: newMember.role,
          permissions: newMember.permissions,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}
