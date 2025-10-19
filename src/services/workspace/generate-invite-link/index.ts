import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {
  GenerateInviteLinkRequest,
  GenerateInviteLinkResponse,
} from "../../../types/workspace/generate-invite-link";
import { getPrisma } from "../../../lib/prisma";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
import { WorkspaceMemberAllocations } from "../../../utils/allocations/workspace-member-allocations";
import { BadRequestError, NotFoundError } from "../../../errors";

export class GenerateInviteLinkService {
  static async generateInviteLink(
    creatorUserId: number,
    data: GenerateInviteLinkRequest
  ): Promise<GenerateInviteLinkResponse> {
    try {
      const prisma = getPrisma();

      // Check if workspace exists
      const workspace = await prisma.workspace.findUnique({
        where: { slug: data.workspaceSlug },
        select: {
          id: true,
          name: true,
          slug: true,
          ownerId: true,
        },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      // Check if user has permission to invite members
      await PermissionManager.requirePermission({
        userId: creatorUserId,
        workspaceId: workspace.id,
        action: PermissionAction.INVITE_MEMBER,
      });

      // Check member allocation limit using WorkspaceMemberAllocations
      const workspaceWithLimits = await prisma.workspace.findUnique({
        where: { id: workspace.id },
        select: {
          planType: true,
          addOns: {
            where: {
              OR: [
                { status: "ACTIVE" },
                {
                  status: "CANCELLED",
                  endDate: { gt: new Date() },
                },
              ],
            },
            select: {
              type: true,
              quantity: true,
              status: true,
              endDate: true,
            },
          },
        },
      });

      const currentMemberCount = await prisma.workspaceMember.count({
        where: {
          workspaceId: workspace.id,
          status: {
            in: ["ACTIVE", "PENDING"],
          },
        },
      });

      const canAddMember = WorkspaceMemberAllocations.canAddMember(
        currentMemberCount,
        {
          workspacePlanType: workspaceWithLimits!.planType,
          addOns: workspaceWithLimits!.addOns,
        }
      );

      if (!canAddMember) {
        throw new BadRequestError(
          "Cannot generate invite link. Workspace member limit reached."
        );
      }

      const linkId = uuidv4();

      const payload = {
        workspaceId: workspace.id,
        workspaceSlug: workspace.slug,
        role: String(data.role),
        type: "workspace_direct_link" as const,
        linkId,
        createdBy: creatorUserId,
      };

      const invitationToken = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: data.expiresIn,
      } as jwt.SignOptions);

      const link = `${process.env.FRONTEND_URL}/register?join-workspace=${invitationToken}`;

      return {
        link,
        token: invitationToken,
      };
    } catch (error) {
      throw error;
    }
  }
}
