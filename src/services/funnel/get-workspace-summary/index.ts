import { getPrisma } from "../../../lib/prisma";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../../errors/http-errors";
import { ZodError } from "zod";
import { hasPermissionToViewFunnels } from "../../../helpers/funnel/getAll/permissions.helper";
import {
  GetWorkspaceFunnelsSummaryRequestSchema,
  WorkspaceFunnel,
} from "../../../types/funnel/get-workspace-summary/get-workspace-summary.types";

export class GetWorkspaceFunnelsSummaryService {
  static async getWorkspaceFunnelsSummary(
    userId: number,
    requestData: unknown
  ): Promise<WorkspaceFunnel[]> {
    try {
      const validatedData = GetWorkspaceFunnelsSummaryRequestSchema.parse(requestData);
      const { workspaceSlug } = validatedData;

      // Get workspace by slug
      const workspace = await getPrisma().workspace.findUnique({
        where: { slug: workspaceSlug },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      // Check if user is workspace owner
      const isOwner = workspace.ownerId === userId;

      if (!isOwner) {
        // Check if user is a workspace member and get their role
        const member = await getPrisma().workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId,
              workspaceId: workspace.id,
            },
          },
          select: {
            role: true,
          },
        });

        if (!member) {
          throw new ForbiddenError("Access denied");
        }

        // Check if user has permission to view funnels (all roles can view funnels)
        if (!hasPermissionToViewFunnels(member.role)) {
          throw new ForbiddenError("Access denied");
        }
      }

      // Get funnels for the workspace
      const funnels = await getPrisma().funnel.findMany({
        where: { workspaceId: workspace.id },
        select: {
          id: true,
          name: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const workspaceFunnels: WorkspaceFunnel[] = funnels.map((funnel) => ({
        id: funnel.id,
        name: funnel.name,
      }));

      return workspaceFunnels;
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        throw new BadRequestError(
          error.issues[0]?.message || "Invalid request data"
        );
      }
      throw error;
    }
  }
}