import { getPrisma } from "../../../lib/prisma";
import { BadRequestError, NotFoundError, ForbiddenError } from "../../../errors/http-errors";
import { ZodError } from "zod";
import {
  GetFunnelConnectionRequestSchema,
  GetFunnelConnectionResponse,
  GetFunnelConnectionResponseSchema,
} from "../../../types/domain-funnel/get-funnel-connection";
import { PermissionManager } from "../../../utils/workspace-utils/workspace-permission-manager";
import { PermissionAction } from "../../../utils/workspace-utils/workspace-permission-manager/types";

export class GetFunnelConnectionService {
  static async getFunnelConnection(
    userId: number,
    requestData: unknown
  ): Promise<GetFunnelConnectionResponse> {
    try {
      const validatedData = GetFunnelConnectionRequestSchema.parse(requestData);
      const { workspaceSlug, funnelSlug } = validatedData;

      const prisma = getPrisma();

      // Get funnel with workspace info using slugs
      const funnel = await prisma.funnel.findFirst({
        where: {
          slug: funnelSlug,
          workspace: {
            slug: workspaceSlug,
          },
        },
        select: {
          id: true,
          name: true,
          workspaceId: true,
          workspace: {
            select: {
              id: true,
              slug: true,
              ownerId: true,
            },
          },
        },
      });

      if (!funnel) {
        throw new NotFoundError("Funnel not found");
      }

      // Check if user has permission to view this funnel
      const permissionCheck = await PermissionManager.can({
        userId,
        workspaceId: funnel.workspaceId,
        action: PermissionAction.VIEW_FUNNEL,
      });

      if (!permissionCheck.allowed) {
        throw new ForbiddenError(
          permissionCheck.reason || "You don't have permission to view this funnel"
        );
      }

      // Get the connected domain for this funnel
      const connection = await prisma.funnelDomain.findFirst({
        where: { funnelId: funnel.id },
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