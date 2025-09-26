import { getPrisma } from "../../../lib/prisma";
import { ZodError } from "zod";
import {
  CreateWorkspaceRequest,
  createWorkspaceRequest,
} from "../../../types/workspace/create";
import { DomainConfig } from "../../../types/domain/shared/domain.types";
import {
  validateSlugAvailability,
  validateWorkspaceNameUniqueness,
  validateUserWorkspaceLimit,
  validateSlugFormat,
} from "../../../helpers/workspace/create";
import { createARecord } from "../../../helpers/domain/create-subdomain";
import {
  BadRequestError,
  InternalServerError,
} from "../../../errors/http-errors";
import {
  WorkspaceRole,
  WorkspacePermission,
} from "../../../generated/prisma-client";
import { rolePermissionPresets } from "../../../types/workspace/update";
import { cacheService } from "../../cache/cache.service";

export class CreateWorkspaceService {
  static async create(
    userId: number,
    requestData: unknown
  ): Promise<{
    message: string;
    workspaceId: number;
    slug: string;
    name: string;
  }> {
    try {
      const validatedData = createWorkspaceRequest.parse(requestData);
      const { name, slug, description, image } = validatedData;

      // Validate user hasn't exceeded their workspace limit
      await validateUserWorkspaceLimit(userId);

      // Validate slug format and availability
      validateSlugFormat(slug);
      await validateSlugAvailability(slug);
      await validateWorkspaceNameUniqueness(userId, name);

      const prisma = getPrisma();

      // Prepare domain configuration for subdomain creation
      // const workspaceDomainConfig: DomainConfig = {
      //   baseDomain: process.env.WORKSPACE_DOMAIN || "digitalsite.com",
      //   zoneId: process.env.WORKSPACE_ZONE_ID || "",
      //   targetIp: process.env.WORKSPACE_IP || "20.56.136.29",
      // };

      // if (!workspaceDomainConfig.zoneId) {
      //   throw new InternalServerError(
      //     "Workspace domain configuration is missing. Please contact support."
      //   );
      // }

      // Start transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create the workspace
        const workspaceData: any = {
          name,
          slug,
          description,
          ownerId: userId,
        };

        if (image) {
          workspaceData.image = image;
        }

        const workspace = await tx.workspace.create({
          data: workspaceData,
        });

        // 2. Create workspace member (owner)
        await tx.workspaceMember.create({
          data: {
            userId,
            workspaceId: workspace.id,
            role: WorkspaceRole.OWNER,
            permissions: [
              WorkspacePermission.MANAGE_WORKSPACE,
              WorkspacePermission.MANAGE_MEMBERS,
              WorkspacePermission.CREATE_FUNNELS,
              WorkspacePermission.EDIT_FUNNELS,
              WorkspacePermission.EDIT_PAGES,
              WorkspacePermission.DELETE_FUNNELS,
              WorkspacePermission.VIEW_ANALYTICS,
              WorkspacePermission.MANAGE_DOMAINS,
              WorkspacePermission.CREATE_DOMAINS,
              WorkspacePermission.DELETE_DOMAINS,
              WorkspacePermission.CONNECT_DOMAINS,
            ],
          },
        });

        // 3. Initialize default role permission templates for the workspace
        const rolesToInitialize = [
          WorkspaceRole.ADMIN,
          WorkspaceRole.EDITOR,
          WorkspaceRole.VIEWER,
        ];

        for (const role of rolesToInitialize) {
          await tx.workspaceRolePermTemplate.create({
            data: {
              workspaceId: workspace.id,
              role,
              permissions: rolePermissionPresets[role] || [],
            },
          });
        }

        return workspace;
      });

      // 4. Create DNS record for workspace subdomain (digitalsite.com)
      // Temporarily skip for local testing
      // if (workspaceDomainConfig.zoneId) {
      //   try {
      //     await createARecord(
      //       slug,
      //       workspaceDomainConfig.zoneId,
      //       workspaceDomainConfig.targetIp // target IP
      //     );
      //   } catch (dnsError) {
      //     console.error("DNS record creation failed:", dnsError);
      //   }
      // }

      // Invalidate user's workspaces cache since they have a new workspace
      try {
        await cacheService.invalidateUserWorkspacesCache(userId);
        console.log(`[Cache] Invalidated user workspaces cache for user ${userId}`);
      } catch (cacheError) {
        console.error("Failed to invalidate user workspaces cache:", cacheError);
        // Don't fail the create operation if cache invalidation fails
      }

      return {
        message: "Workspace created successfully",
        workspaceId: result.id,
        slug: result.slug,
        name: result.name,
      };
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid data provided";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}
