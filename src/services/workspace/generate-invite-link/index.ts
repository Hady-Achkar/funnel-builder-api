import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import {
  GenerateInviteLinkRequest,
  GenerateInviteLinkResponse,
} from "../../../types/workspace/generate-invite-link";
import {
  validateWorkspaceExists,
  validateInviterPermissions,
} from "../../../utils/workspace-utils/workspace-validation";
import { getPrisma } from "../../../lib/prisma";
import { WorkspaceMemberAllocations } from "../../../utils/allocations/workspace-member-allocations";
import { BadRequestError } from "../../../errors";

export class GenerateInviteLinkService {
  static async generateInviteLink(
    creatorUserId: number,
    data: GenerateInviteLinkRequest
  ): Promise<GenerateInviteLinkResponse> {
    try {
      const workspace = await validateWorkspaceExists(data.workspaceSlug);

      validateInviterPermissions(workspace, creatorUserId);

      // Check member allocation limit using WorkspaceMemberAllocations
      const prisma = getPrisma();
      const workspaceWithLimits = await prisma.workspace.findUnique({
        where: { id: workspace.id },
        select: {
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

      const currentMemberCount = await prisma.workspaceMember.count({
        where: {
          workspaceId: workspace.id,
          status: {
            in: ['ACTIVE', 'PENDING'],
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

      const link = `${process.env.FRONTEND_URL}/join-workspace?token=${invitationToken}`;

      return {
        link,
        token: invitationToken,
      };
    } catch (error) {
      throw error;
    }
  }
}
