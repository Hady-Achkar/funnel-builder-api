import { getPrisma } from "../../../lib/prisma";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../../errors/http-errors";
import { ZodError } from "zod";
import {
  GetFunnelConnectionRequestSchema,
  GetFunnelConnectionResponse,
  GetFunnelConnectionResponseSchema,
} from "../../../types/domain-funnel/get-funnel-connection";
import { hasPermissionToViewFunnel } from "../../../helpers/funnel/get";

export class GetFunnelConnectionService {
  static async getFunnelConnection(
    userId: number,
    requestData: unknown
  ): Promise<GetFunnelConnectionResponse> {
    try {
      const validatedData = GetFunnelConnectionRequestSchema.parse(requestData);
      const { funnelId } = validatedData;

      const prisma = getPrisma();

      // Get funnel with workspace info
      const funnel = await prisma.funnel.findUnique({
        where: { id: funnelId },
        select: {
          id: true,
          name: true,
          workspaceId: true,
          workspace: {
            select: {
              id: true,
              ownerId: true,
            },
          },
        },
      });

      if (!funnel) {
        throw new NotFoundError("Funnel not found");
      }

      // Check permissions
      const isOwner = funnel.workspace.ownerId === userId;

      if (!isOwner) {
        const member = await prisma.workspaceMember.findUnique({
          where: {
            userId_workspaceId: {
              userId,
              workspaceId: funnel.workspaceId,
            },
          },
          select: {
            role: true,
          },
        });

        if (!member) {
          throw new ForbiddenError("You don't have access to this funnel");
        }

        // Check if user has permission to view funnels
        const canView = hasPermissionToViewFunnel(member.role);

        if (!canView) {
          throw new ForbiddenError("You don't have permission to view this funnel");
        }
      }

      // Get the connected domain for this funnel
      const connection = await prisma.funnelDomain.findFirst({
        where: { funnelId },
        select: {
          domain: {
            select: {
              id: true,
              hostname: true,
            },
          },
          isActive: true,
        },
      });

      const response: GetFunnelConnectionResponse = {
        funnel: {
          id: funnel.id,
          name: funnel.name,
        },
        domain: connection ? connection.domain : null,
        isActive: connection?.isActive || false,
      };

      return GetFunnelConnectionResponseSchema.parse(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid request data";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}