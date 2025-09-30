import { getPrisma } from "../../../lib/prisma";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../../../errors/http-errors";
import { ZodError } from "zod";
import {
  WorkspaceRole,
  WorkspacePermission,
} from "../../../generated/prisma-client";
import {
  GetWorkspaceDomainsSummaryResponse,
  GetWorkspaceDomainsSummaryRequestSchema,
  GetWorkspaceDomainsSummaryResponseSchema,
  WorkspaceDomain,
} from "../../../types/domain/get-workspace-summary/get-workspace-summary.types";

export class GetWorkspaceDomainsSummaryService {
  static async getWorkspaceDomainsSummary(
    userId: number,
    requestData: unknown
  ): Promise<GetWorkspaceDomainsSummaryResponse> {
    try {
      const validatedData =
        GetWorkspaceDomainsSummaryRequestSchema.parse(requestData);
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
        // Check if user is a workspace member and get their role and permissions
        const member = await getPrisma().workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId,
              workspaceId: workspace.id,
            },
          },
          select: {
            role: true,
            permissions: true,
          },
        });

        if (!member) {
          throw new ForbiddenError("Access denied");
        }

        // Check if user is admin or has CONNECT_DOMAINS permission
        const isAdmin = member.role === WorkspaceRole.ADMIN;
        const hasConnectDomainsPermission = member.permissions.includes(
          WorkspacePermission.CONNECT_DOMAINS
        );

        if (!isAdmin && !hasConnectDomainsPermission) {
          throw new ForbiddenError("Access denied");
        }
      }

      // Get domains for the workspace
      const domains = await getPrisma().domain.findMany({
        where: { workspaceId: workspace.id },
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

      const response: GetWorkspaceDomainsSummaryResponse = {
        domains: workspaceDomains,
      };

      return GetWorkspaceDomainsSummaryResponseSchema.parse(response);
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
