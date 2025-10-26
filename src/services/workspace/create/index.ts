import { getPrisma } from "../../../lib/prisma";
import { CreateWorkspaceRequest } from "../../../types/workspace/create";
import {
  BadRequestError,
  InternalServerError,
  BadGatewayError,
  ForbiddenError,
} from "../../../errors/http-errors";
import {
  WorkspaceRole,
  WorkspacePermission,
  WorkspaceStatus,
  UserPlan,
} from "../../../generated/prisma-client";
import { rolePermissionPresets } from "../../../types/workspace/update";
import { cacheService } from "../../cache/cache.service";
import { determineWorkspacePlanType } from "./utils/workspace-plan";
import { isSlugReserved } from "./utils/reserved-slugs";
import { UserWorkspaceAllocations } from "../../../utils/allocations/user-workspace-allocations";
export class CreateWorkspaceService {
  static async create(
    userId: number,
    data: CreateWorkspaceRequest
  ): Promise<{
    message: string;
    workspaceId: number;
    slug: string;
    name: string;
  }> {
    try {
      const prisma = getPrisma();

      // 1. CHECK RESERVED SLUGS
      if (isSlugReserved(data.slug)) {
        throw new BadRequestError(
          `The name "${data.slug}" is reserved and cannot be used. Please choose a different name.`
        );
      }

      // 2. GET USER DATA (for plan checks)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          plan: true,
        },
      });

      if (!user) {
        throw new InternalServerError("User not found");
      }

      // 3. CHECK IF USER IS WORKSPACE_MEMBER (not allowed to create workspaces)
      if (user.plan === UserPlan.WORKSPACE_MEMBER) {
        throw new ForbiddenError(
          "Workspace members cannot create workspaces. Please upgrade your account to a full plan to create your own workspace."
        );
      }

      // 4. GET USER ADD-ONS (for limit calculation)
      const userAddOns = await prisma.addOn.findMany({
        where: {
          userId: userId,
        },
        select: {
          type: true,
          quantity: true,
          status: true,
          endDate: true, // Required for validating if addon is expired
        },
      });

      // 5. CHECK WORKSPACE LIMIT (using allocation utility)
      const currentCount = await prisma.workspace.count({
        where: { ownerId: userId },
      });

      const canCreate = UserWorkspaceAllocations.canCreateWorkspace(
        currentCount,
        {
          plan: user.plan,
          addOns: userAddOns,
        }
      );

      if (!canCreate) {
        throw new BadRequestError(
          "You've reached your workspace limit. Upgrade your plan to create more workspaces."
        );
      }

      // 6. CHECK SLUG AVAILABILITY
      const existingWorkspace = await prisma.workspace.findUnique({
        where: { slug: data.slug },
      });

      if (existingWorkspace) {
        throw new BadRequestError(
          "This workspace name is already taken. Please choose another one."
        );
      }

      // 7. CHECK NAME UNIQUENESS
      const existingName = await prisma.workspace.findFirst({
        where: {
          ownerId: userId,
          name: data.name,
        },
      });

      if (existingName) {
        throw new BadRequestError(
          "You already have a workspace with this name. Please choose a different name."
        );
      }

      // BUSINESS LOGIC LAYER

      // 8. DETERMINE WORKSPACE PLAN TYPE (using service util)
      // Inherits user's plan by default, or uses explicit override
      const workspacePlanType = determineWorkspacePlanType(
        user.plan,
        data.planType
      );

      // 9. DETERMINE WORKSPACE STATUS
      // Set to DRAFT for FREE and AGENCY plans, ACTIVE for BUSINESS
      const workspaceStatus =
        user.plan === UserPlan.FREE || user.plan === UserPlan.AGENCY
          ? WorkspaceStatus.DRAFT
          : WorkspaceStatus.ACTIVE;

      // 10. CREATE WORKSPACE IN TRANSACTION
      const result = await prisma.$transaction(async (tx) => {
        // Create workspace with planType and status
        const workspaceData: {
          name: string;
          slug: string;
          description?: string;
          image?: string;
          ownerId: number;
          planType: typeof workspacePlanType;
          status: typeof workspaceStatus;
        } = {
          name: data.name,
          slug: data.slug,
          description: data.description,
          ownerId: userId,
          planType: workspacePlanType,
          status: workspaceStatus,
        };

        // Add image if provided
        if (data.image) {
          workspaceData.image = data.image;
        }

        const workspace = await tx.workspace.create({
          data: workspaceData,
        });

        // Create owner membership with all permissions
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

        // Initialize default role permission templates for the workspace
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

      // 11. INVALIDATE USER'S WORKSPACES CACHE
      try {
        await cacheService.invalidateUserWorkspacesCache(userId);
      } catch (cacheError) {
        console.error(
          "Failed to invalidate user workspaces cache:",
          cacheError
        );
      }

      return {
        message: "Workspace created successfully",
        workspaceId: result.id,
        slug: result.slug,
        name: result.name,
      };
    } catch (error: unknown) {
      throw error;
    }
  }
}
