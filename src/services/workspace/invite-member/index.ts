import { getPrisma } from "../../../lib/prisma";
import jwt from "jsonwebtoken";
import {
  InviteMemberRequest,
  InviteMemberResponse,
} from "../../../types/workspace/invite-member";
import { MembershipStatus } from "../../../generated/prisma-client";
import {
  validateWorkspaceExists,
  validateInviterPermissions,
  validateInvitationRequest,
} from "../../../helpers/workspace/invite-member/validation";
import {
  sendWorkspaceInvitationEmail,
  sendWorkspaceRegisterInvitationEmail,
} from "../../../helpers/workspace/invite-member";
import { cacheService } from "../../cache/cache.service";
import { WorkspaceMemberAllocations } from "../../../utils/workspace-member-allocations";
import { BadRequestError } from "../../../errors";

export class InviteMemberService {
  static async inviteMember(
    inviterUserId: number,
    data: InviteMemberRequest
  ): Promise<InviteMemberResponse> {
    try {
      const prisma = getPrisma();

      const workspace = await validateWorkspaceExists(data.workspaceSlug);

      validateInviterPermissions(workspace, inviterUserId);

      // Check member allocation limit using WorkspaceMemberAllocations
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
          "Cannot add more members. Workspace member limit reached."
        );
      }

      // Check if this email has already been invited (PENDING) or is already a member (ACTIVE)
      const existingMemberByEmail = await prisma.workspaceMember.findFirst({
        where: {
          workspaceId: workspace.id,
          email: data.email,
          status: {
            in: ['ACTIVE', 'PENDING'],
          },
        },
      });

      if (existingMemberByEmail) {
        if (existingMemberByEmail.status === MembershipStatus.ACTIVE) {
          throw new BadRequestError("User is already a member of this workspace");
        } else {
          throw new BadRequestError("This email has already been invited to the workspace");
        }
      }

      const userToInvite = await prisma.user.findUnique({
        where: { email: data.email },
        select: { id: true, email: true },
      });

      validateInvitationRequest(userToInvite, workspace.ownerId);

      const invitationToken = jwt.sign(
        {
          workspaceId: workspace.id,
          workspaceSlug: workspace.slug,
          role: data.role,
          email: data.email,
          type: "workspace_invitation",
        },
        process.env.JWT_SECRET!,
        { expiresIn: "7d" }
      );

      // Get role permissions template
      const rolePermTemplate =
        await prisma.workspaceRolePermTemplate.findUnique({
          where: {
            workspaceId_role: {
              workspaceId: workspace.id,
              role: data.role,
            },
          },
        });

      const permissions = rolePermTemplate?.permissions || [];

      if (!userToInvite) {
        // For non-existing users: Create pending membership without userId
        await prisma.workspaceMember.create({
          data: {
            userId: null,
            email: data.email,
            workspaceId: workspace.id,
            role: data.role,
            permissions,
            status: MembershipStatus.PENDING,
            invitedBy: inviterUserId,
          },
        });

        await sendWorkspaceRegisterInvitationEmail(
          data.email,
          workspace.name,
          data.role,
          invitationToken
        );
      } else {
        // For existing users: Create pending membership
        await prisma.workspaceMember.create({
          data: {
            userId: userToInvite.id,
            email: userToInvite.email,
            workspaceId: workspace.id,
            role: data.role,
            permissions,
            status: MembershipStatus.PENDING,
            invitedBy: inviterUserId,
          },
        });

        await sendWorkspaceInvitationEmail(
          userToInvite.email,
          workspace.name,
          data.role,
          invitationToken
        );
      }

      // Invalidate workspace cache since member list changed
      try {
        await cacheService.del(`slug:${workspace.slug}`, { prefix: "workspace" });
        console.log(`[Cache] Invalidated workspace cache for ${workspace.slug} after member invited`);
      } catch (cacheError) {
        console.error("Failed to invalidate workspace cache:", cacheError);
        // Don't fail the operation if cache invalidation fails
      }

      return {
        message: "Member invited successfully",
      };
    } catch (error) {
      throw error;
    }
  }
}
