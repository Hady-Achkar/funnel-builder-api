import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors/http-errors";
import { ZodError } from "zod";
import { validateWorkspaceAccess } from "../../../domain/shared/helpers";
import {
  GetConnectionsRequestSchema,
  GetConnectionsResponse,
  GetConnectionsResponseSchema,
} from "../types";

export class GetConnectionsService {
  static async getConnections(
    userId: number,
    requestData: unknown
  ): Promise<GetConnectionsResponse> {
    try {
      const validatedData = GetConnectionsRequestSchema.parse(requestData);
      const { workspaceId } = validatedData;

      await validateWorkspaceAccess(userId, workspaceId, []);

      const prisma = getPrisma();

      const connections = await prisma.funnelDomain.findMany({
        where: {
          funnel: {
            workspaceId,
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
