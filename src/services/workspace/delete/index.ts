import { getPrisma } from "../../../lib/prisma";
import {
  DeleteWorkspaceResponse,
  deleteWorkspaceResponse,
  deleteWorkspaceParams,
} from "../../../types/workspace/delete";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../errors/http-errors";
import { ZodError } from "zod";
import { cacheService } from "../../cache/cache.service";

export class DeleteWorkspaceService {
  static async deleteBySlug(
    userId: number,
    slug: string
  ): Promise<DeleteWorkspaceResponse> {
    try {
      const validatedParams = deleteWorkspaceParams.parse({ slug });

      const prisma = getPrisma();

      const workspace = await prisma.workspace.findUnique({
        where: { slug: validatedParams.slug },
        include: {
          owner: {
            select: {
              id: true,
            },
          },
          members: true,
          funnels: true,
          domains: true,
        },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      if (workspace.owner.id !== userId) {
        throw new ForbiddenError(
          "Only workspace owner can delete the workspace"
        );
      }

      if (workspace.funnels.length > 0) {
        throw new BadRequestError(
          "Cannot delete workspace with existing funnels. Please delete all funnels first."
        );
      }

      if (workspace.domains.length > 0) {
        throw new BadRequestError(
          "Cannot delete workspace with existing domains. Please remove all domains first."
        );
      }

      await prisma.$transaction(async (tx) => {
        // Delete role permission templates
        await tx.workspaceRolePermTemplate.deleteMany({
          where: { workspaceId: workspace.id },
        });

        await tx.workspaceMember.deleteMany({
          where: { workspaceId: workspace.id },
        });

        await tx.workspace.delete({
          where: { id: workspace.id },
        });
      });

      // Invalidate all caches related to this workspace
      try {
        // Invalidate workspace cache by ID
        await cacheService.invalidateWorkspaceCache(workspace.id);

        // Invalidate workspace cache by slug (new pattern without userId)
        await cacheService.del(`slug:${workspace.slug}`, {
          prefix: "workspace",
        });

        // Invalidate user workspaces cache for owner
        await cacheService.invalidateUserWorkspacesCache(workspace.owner.id);

        // Invalidate cache for all members
        for (const member of workspace.members) {
          await cacheService.invalidateUserWorkspacesCache(member.userId);
        }
      } catch (cacheError) {
        console.error("Failed to invalidate workspace cache:", cacheError);
        // Don't fail the delete operation if cache invalidation fails
      }

      const response: DeleteWorkspaceResponse = {
        success: true,
        message: "Workspace has been deleted successfully",
      };

      return deleteWorkspaceResponse.parse(response);
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid data provided";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}
