import { getPrisma } from "../../../lib/prisma";
import { BadRequestError, NotFoundError } from "../../../errors/http-errors";
import { ZodError } from "zod";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";
import {
  GetConnectionsRequestSchema,
  GetConnectionsResponse,
  GetConnectionsResponseSchema,
} from "../../../types/domain-funnel/get-connections";

export class GetConnectionsService {
  static async getConnections(
    userId: number,
    requestData: unknown
  ): Promise<GetConnectionsResponse> {
    try {
      const validatedData = GetConnectionsRequestSchema.parse(requestData);
      const { workspaceSlug } = validatedData;

      const prisma = getPrisma();

      // Get workspace by slug
      const workspace = await prisma.workspace.findUnique({
        where: { slug: workspaceSlug },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      // Check permissions using centralized PermissionManager
      await PermissionManager.requirePermission({
        userId,
        workspaceId: workspace.id,
        action: PermissionAction.VIEW_WORKSPACE,
      });

      const connections = await prisma.funnelDomain.findMany({
        where: {
          funnel: {
            workspaceId: workspace.id,
          },
        },
        select: {
          funnel: {
            select: {
              id: true,
              name: true,
            },
          },
          domain: {
            select: {
              id: true,
              hostname: true,
            },
          },
        },
      });

      const response: GetConnectionsResponse = {
        connections: connections.map((connection) => ({
          funnelId: connection.funnel.id,
          funnelName: connection.funnel.name,
          domainId: connection.domain.id,
          domainName: connection.domain.hostname,
        })),
      };

      return GetConnectionsResponseSchema.parse(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid request data";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}