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
  GetWorkspaceDomainsSummaryRequestSchema,
  WorkspaceDomain,
} from "../../../types/domain/get-workspace-summary/get-workspace-summary.types";

export class GetWorkspaceDomainsSummaryService {
  static async getWorkspaceDomainsSummary(
    userId: number,
    requestData: unknown
  ): Promise<WorkspaceDomain[]> {
    try {
      const validatedData =
        GetWorkspaceDomainsSummaryRequestSchema.parse(requestData);
      const { workspaceSlug, search } = validatedData;

      // Get workspace by slug
      const workspace = await getPrisma().workspace.findUnique({
        where: { slug: workspaceSlug },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      // Check if user has permission to manage domains in this workspace
      // Using MANAGE_DOMAIN which requires MANAGE_DOMAINS permission or ADMIN role
      const permissionCheck = await PermissionManager.can({
        userId,
        workspaceId: workspace.id,
        action: PermissionAction.MANAGE_DOMAIN,
      });

      if (!permissionCheck.allowed) {
        throw new ForbiddenError(
          permissionCheck.reason || "You don't have permission to view domains in this workspace"
        );
      }

      // Get domains for the workspace
      const domains = await getPrisma().domain.findMany({
        where: {
          workspaceId: workspace.id,
          ...(search && {
            hostname: {
              contains: search,
              mode: "insensitive",
            },
          }),
        },
        select: {
          id: true,
          hostname: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const workspaceDomains: WorkspaceDomain[] = domains.map((domain) => ({
        id: domain.id,
        hostname: domain.hostname,
      }));

      return workspaceDomains;
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
