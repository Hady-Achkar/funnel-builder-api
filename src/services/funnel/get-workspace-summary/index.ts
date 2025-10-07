import { getPrisma } from "../../../lib/prisma";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../../errors/http-errors";
import { ZodError } from "zod";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";
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
      const validatedData =
        GetWorkspaceFunnelsSummaryRequestSchema.parse(requestData);
      const { workspaceSlug, search } = validatedData;

      // Get workspace by slug
      const workspace = await getPrisma().workspace.findUnique({
        where: { slug: workspaceSlug },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      // Check if user has permission to view funnels in this workspace
      const permissionCheck = await PermissionManager.can({
        userId,
        workspaceId: workspace.id,
        action: PermissionAction.VIEW_FUNNEL,
      });

      if (!permissionCheck.allowed) {
        throw new ForbiddenError(
          permissionCheck.reason || "You don't have permission to view funnels in this workspace"
        );
      }

      const funnels = await getPrisma().funnel.findMany({
        where: {
          workspaceId: workspace.id,
          ...(search && {
            name: {
              contains: search,
              mode: "insensitive",
            },
          }),
        },
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
