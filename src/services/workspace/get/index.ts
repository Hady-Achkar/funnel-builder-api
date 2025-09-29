import { getPrisma } from "../../../lib/prisma";
import {
  GetWorkspaceResponse,
  getWorkspaceResponse,
  getWorkspaceParams,
} from "../../../types/workspace/get";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../errors/http-errors";
import { ZodError } from "zod";
import {
  WorkspaceRole,
  WorkspacePermission,
  FunnelStatus,
} from "../../../generated/prisma-client";
import { rolePermissionPresets } from "../../../types/workspace/update";
import { cacheService } from "../../cache/cache.service";

export class GetWorkspaceService {

  static async getBySlug(
    userId: number,
    slug: string
  ): Promise<GetWorkspaceResponse> {
    try {
      const validatedParams = getWorkspaceParams.parse({ slug });

      // Cache key without userId - workspace data is the same for all users
      const cacheKey = `slug:${slug}`;

      // Try to get from cache first
      const cached = await cacheService.getWorkspaceBySlugCache<GetWorkspaceResponse>(cacheKey);

      if (cached) {
        console.log(`[Cache HIT] Workspace ${slug}`);
        return cached;
      }

      console.log(`[Cache MISS] Workspace ${slug}`);
      const prisma = getPrisma();

      const workspace = await prisma.workspace.findUnique({
        where: { slug: validatedParams.slug },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
              plan: true,
              maximumWorkspaces: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  username: true,
                },
              },
            },
          },
          domains: true,
          funnels: {
            include: {
              _count: {
                select: {
                  pages: true,
                },
              },
            },
          },
        },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      // Check if user has access to this workspace
      const isOwner = workspace.owner.id === userId;
      const userMember = workspace.members.find(
        (member) => member.userId === userId
      );

      if (!isOwner && !userMember) {
        throw new ForbiddenError("You don't have access to this workspace");
      }

      // Get current user's member info
      const currentUserMember = isOwner
        ? {
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
            joinedAt: workspace.createdAt,
          }
        : {
            role: userMember!.role,
            permissions: userMember!.permissions,
            joinedAt: userMember!.joinedAt || userMember!.invitedAt || workspace.createdAt,
          };

      // Calculate usage statistics
      const usage = {
        funnelsUsed: workspace.funnels.length,
        customDomainsUsed: workspace.domains.filter(
          (d) => d.type === "CUSTOM_DOMAIN"
        ).length,
        subdomainsUsed: workspace.domains.filter((d) => d.type === "SUBDOMAIN")
          .length,
        totalDomains: workspace.domains.length,
        membersCount: workspace.members.length + 1, // +1 for owner
        activeFunnels: workspace.funnels.filter(
          (f) => f.status === FunnelStatus.LIVE
        ).length,
        draftFunnels: workspace.funnels.filter(
          (f) => f.status === FunnelStatus.DRAFT
        ).length,
        archivedFunnels: workspace.funnels.filter(
          (f) => f.status === FunnelStatus.ARCHIVED
        ).length,
      };

      // Define limits based on owner's plan
      const planLimits = {
        FREE: { maxFunnels: 3, maxDomains: 1 },
        BUSINESS: { maxFunnels: 10, maxDomains: 5 },
        AGENCY: { maxFunnels: 50, maxDomains: 20 },
      };

      const userPlanLimits =
        planLimits[workspace.owner.plan] || planLimits.FREE;

      const limits = {
        maxFunnels: userPlanLimits.maxFunnels,
        maxDomains: userPlanLimits.maxDomains,
        maxMembers: 50, // Default max members per workspace
        maxStorage: 5000, // 5GB in MB
        funnelsRemaining: Math.max(
          0,
          userPlanLimits.maxFunnels - workspace.funnels.length
        ),
        domainsRemaining: Math.max(
          0,
          userPlanLimits.maxDomains - workspace.domains.length
        ),
      };

      // Transform domains for response
      const domains = workspace.domains.map((domain) => ({
        id: domain.id,
        hostname: domain.hostname,
        type: domain.type,
        status: domain.status,
        sslStatus: domain.sslStatus,
        isVerified: domain.status === "ACTIVE" || domain.status === "VERIFIED",
        isActive: domain.status === "ACTIVE",
        createdAt: domain.createdAt,
        updatedAt: domain.updatedAt,
      }));

      // Transform funnels for response
      const funnels = workspace.funnels.map((funnel) => ({
        id: funnel.id,
        name: funnel.name,
        slug: funnel.slug,
        status: funnel.status,
        createdAt: funnel.createdAt,
        updatedAt: funnel.updatedAt,
        pagesCount: funnel._count.pages,
      }));

      // Get role permission templates from database for this workspace
      const rolePermTemplates = await prisma.workspaceRolePermTemplate.findMany({
        where: { workspaceId: workspace.id },
      });

      // Build role permissions using workspace-specific templates if available
      const workspaceRolePermissions = {
        [WorkspaceRole.OWNER]: rolePermissionPresets[WorkspaceRole.OWNER] || [],
        [WorkspaceRole.ADMIN]: rolePermTemplates.find(t => t.role === WorkspaceRole.ADMIN)?.permissions || rolePermissionPresets[WorkspaceRole.ADMIN] || [],
        [WorkspaceRole.EDITOR]: rolePermTemplates.find(t => t.role === WorkspaceRole.EDITOR)?.permissions || rolePermissionPresets[WorkspaceRole.EDITOR] || [],
        [WorkspaceRole.VIEWER]: rolePermTemplates.find(t => t.role === WorkspaceRole.VIEWER)?.permissions || rolePermissionPresets[WorkspaceRole.VIEWER] || [],
      };

      const membersWithJoinedAt = workspace.members.map((member) => ({
        ...member,
        userId: member.userId || 0,
        joinedAt: member.joinedAt || member.invitedAt || workspace.createdAt,
        user: member.user || {
          id: 0,
          firstName: "Pending",
          lastName: "Invitation",
          email: member.email || "pending@invitation",
          username: "pending",
        },
      }));

      const response: GetWorkspaceResponse = {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        image: workspace.image,
        settings: workspace.settings,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
        owner: workspace.owner,
        currentUserMember,
        members: membersWithJoinedAt,
        domains,
        funnels,
        usage,
        limits,
        rolePermissions: workspaceRolePermissions,
      };

      const validatedResponse = getWorkspaceResponse.parse(response);

      await cacheService.setWorkspaceBySlugCache(cacheKey, validatedResponse, {
        ttl: 0,
      });

      return validatedResponse;
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid data provided";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}
