import { getPrisma } from "../../../lib/prisma";
import { ZodError } from "zod";
import {
  InviteMemberRequest,
  InviteMemberRequestSchema,
  InviteMemberResponse,
} from "../../../types/workspace/invite-member";
import { WorkspacePermissions } from "../../../helpers/workspace-permissions";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../errors";

export class InviteMemberService {
  static async inviteMember(
    inviterUserId: number,
    requestData: unknown
  ): Promise<InviteMemberResponse> {
    try {
      const validatedData = InviteMemberRequestSchema.parse(requestData);
      return await this.processInvitation(inviterUserId, validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError("Invalid request data");
      }
      throw error;
    }
  }

  private static async processInvitation(
    inviterUserId: number,
    data: InviteMemberRequest
  ): Promise<InviteMemberResponse> {
    const prisma = getPrisma();

    const workspace = await prisma.workspace.findUnique({
      where: { slug: data.workspaceSlug },
      include: {
        members: {
          where: { userId: inviterUserId },
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundError("Workspace not found");
    }

    const inviterMember = workspace.members[0];
    if (!inviterMember) {
      throw new ForbiddenError("You are not a member of this workspace");
    }

    if (
      !WorkspacePermissions.canInviteMembers({
        role: inviterMember.role,
        permissions: inviterMember.permissions,
      })
    ) {
      throw new ForbiddenError("You don't have permission to invite members");
    }

    const userToInvite = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!userToInvite) {
      throw new NotFoundError("User with this email does not exist");
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userToInvite.id,
          workspaceId: workspace.id,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestError("User is already a member of this workspace");
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        userId: userToInvite.id,
        workspaceId: workspace.id,
        role: data.role,
        permissions: data.permissions || [],
      },
    });

    return {
      message: "Member invited successfully",
      member: {
        id: newMember.id,
        userId: newMember.userId,
        workspaceId: newMember.workspaceId,
        role: newMember.role,
        permissions: newMember.permissions,
        joinedAt: newMember.joinedAt,
      },
    };
  }
}
