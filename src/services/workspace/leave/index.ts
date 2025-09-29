import { getPrisma } from "../../../lib/prisma";
import {
  LeaveWorkspaceResponse,
  leaveWorkspaceResponse,
} from "../../../types/workspace/leave";
import { ForbiddenError, NotFoundError } from "../../../errors/http-errors";
import { cacheService } from "../../cache/cache.service";

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
      try {
        await cacheService.del(`slug:${workspace.slug}`, { prefix: "workspace" });
        console.log(`[Cache] Invalidated workspace cache for ${workspace.slug} after member left`);
      } catch (cacheError) {
        console.error("Failed to invalidate workspace cache:", cacheError);
      }
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
