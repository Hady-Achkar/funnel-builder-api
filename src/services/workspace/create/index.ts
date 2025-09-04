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
  validateUserAllocationBudget,
  validateSlugFormat,
  validateAllocationAmounts,
} from "../../../helpers/workspace/create";
import { CreateSubdomainService } from "../../domain/create-subdomain/create-subdomain.service";
import {
  BadRequestError,
  InternalServerError,
} from "../../../errors/http-errors";
import {
  WorkspaceRole,
  WorkspacePermission,
} from "../../../generated/prisma-client";

export class CreateWorkspaceService {
  static async create(
    userId: number,
    requestData: unknown
  ): Promise<{ message: string; workspaceId: number }> {
    try {
      // Validate request data
      const validatedData = createWorkspaceRequest.parse(requestData);
      const { name, slug, description, allocations } = validatedData;

      // Default allocations to 0 if not provided (stepper approach)
      const finalAllocations = allocations || {
        allocatedFunnels: 0,
        allocatedCustomDomains: 0,
        allocatedSubdomains: 0,
      };

      // Validate slug format and availability
      validateSlugFormat(slug);
      await validateSlugAvailability(slug);
      await validateWorkspaceNameUniqueness(userId, name);

      // Only validate allocations if they're provided and > 0
      if (allocations) {
        validateAllocationAmounts(finalAllocations);

        // Only check budget if user is actually allocating resources
        const hasAllocations =
          finalAllocations.allocatedFunnels > 0 ||
          finalAllocations.allocatedCustomDomains > 0 ||
          finalAllocations.allocatedSubdomains > 0;

        if (hasAllocations) {
          await validateUserAllocationBudget({
            userId,
            requestedFunnels: finalAllocations.allocatedFunnels,
            requestedCustomDomains: finalAllocations.allocatedCustomDomains,
            requestedSubdomains: finalAllocations.allocatedSubdomains,
          });
        }
      }

      const prisma = getPrisma();

      // Prepare domain configuration for subdomain creation
      const workspaceDomainConfig: DomainConfig = {
        baseDomain: process.env.WORKSPACE_DOMAIN || "digitalsite.com",
        zoneId: process.env.WORKSPACE_ZONE_ID || "",
        targetIp: process.env.WORKSPACE_IP || "20.56.136.29",
      };

      // Validate domain configuration
      if (!workspaceDomainConfig.zoneId) {
        throw new InternalServerError(
          "Workspace domain configuration is missing. Please contact support."
        );
      }

      // Start transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create the workspace
        const workspace = await tx.workspace.create({
          data: {
            name,
            slug,
            description,
            ownerId: userId,
            allocatedFunnels: finalAllocations.allocatedFunnels,
            allocatedCustomDomains: finalAllocations.allocatedCustomDomains,
            allocatedSubdomains: finalAllocations.allocatedSubdomains,
          },
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

        return workspace;
      });

      // 4. Create subdomain (outside transaction to avoid rollback complications)
      // Make subdomain creation optional for now - can be created later
      try {
        await CreateSubdomainService.create(
          userId,
          {
            subdomain: slug,
            workspaceId: result.id,
          },
          workspaceDomainConfig
        );
        console.log(
          `Subdomain created successfully for workspace: ${slug}.digitalsite.com`
        );
      } catch (subdomainError) {
        // Log error but don't fail workspace creation
        console.error(
          "Failed to create subdomain for workspace (workspace still created):",
          {
            workspaceSlug: slug,
            error: subdomainError,
            domainConfig: workspaceDomainConfig,
            stack:
              subdomainError instanceof Error
                ? subdomainError.stack
                : "No stack trace",
          }
        );

        // Continue without subdomain - user can create it later
        console.log(
          `Workspace created successfully without subdomain: ${slug}`
        );
      }

      return {
        message: "Workspace created successfully",
        workspaceId: result.id,
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
