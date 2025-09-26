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
  validateMemberAllocationLimit,
  validateInvitationRequest,
  checkExistingMembership,
} from "../../../helpers/workspace/invite-member/validation";
import {
  sendWorkspaceInvitationEmail,
  sendWorkspaceRegisterInvitationEmail,
} from "../../../helpers/workspace/invite-member";

export class InviteMemberService {
  static async inviteMember(
    inviterUserId: number,
    data: InviteMemberRequest
  ): Promise<InviteMemberResponse> {
    try {
      const prisma = getPrisma();

      const workspace = await validateWorkspaceExists(data.workspaceSlug);

      validateInviterPermissions(workspace, inviterUserId);

      await validateMemberAllocationLimit(workspace.ownerId, workspace.id);

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
        // For existing users: Check membership then create pending membership
        await checkExistingMembership(userToInvite.id, workspace.id);

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

      return {
        message: "Member invited successfully",
      };
    } catch (error) {
      throw error;
    }
  }
}
