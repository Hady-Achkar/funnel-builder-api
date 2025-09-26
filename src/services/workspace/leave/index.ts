import { getPrisma } from "../../../lib/prisma";
import {
  LeaveWorkspaceResponse,
  leaveWorkspaceResponse,
} from "../../../types/workspace/leave";
import { ForbiddenError, NotFoundError } from "../../../errors/http-errors";

export class LeaveWorkspaceService {
  static async leave(
    userId: number,
    slug: string
  ): Promise<LeaveWorkspaceResponse> {
    try {
      const prisma = getPrisma();

      const workspace = await prisma.workspace.findUnique({
        where: { slug },
        include: {
          owner: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      if (workspace.owner.id === userId) {
        throw new ForbiddenError(
          "Workspace owner cannot leave their own workspace"
        );
      }

      const workspaceMember = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: workspace.id,
          },
        },
      });

      if (!workspaceMember) {
        throw new ForbiddenError("You are not a member of this workspace");
      }

      await prisma.workspaceMember.delete({
        where: {
          id: workspaceMember.id,
        },
      });

      const response: LeaveWorkspaceResponse = {
        success: true,
        message: "Successfully left workspace",
      };

      return leaveWorkspaceResponse.parse(response);
    } catch (error) {
      throw error;
    }
  }
}
