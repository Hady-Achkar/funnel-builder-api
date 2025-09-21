import { getPrisma } from "../../../lib/prisma";
import {
  GetWorkspaceResponse,
  getWorkspaceResponse,
  getWorkspaceParams
} from "../../../types/workspace/get";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError
} from "../../../errors/http-errors";
import { ZodError } from "zod";
import { WorkspaceRole, WorkspacePermission, FunnelStatus } from "../../../generated/prisma-client";
import { rolePermissionPresets } from "../../../types/workspace/update";

export class GetWorkspaceService {
  // Helper function to generate permission groups for each role
  private static generatePermissionGroups(role: WorkspaceRole) {
    const permissions = rolePermissionPresets[role] || [];

    return {
      workspace: {
        enabled: permissions.includes(WorkspacePermission.MANAGE_WORKSPACE as any) ||
                 permissions.includes(WorkspacePermission.MANAGE_MEMBERS as any),
        permissions: {
          renameAndChangeIcon: permissions.includes(WorkspacePermission.MANAGE_WORKSPACE as any),
          inviteMembers: permissions.includes(WorkspacePermission.MANAGE_MEMBERS as any),
          changeRoles: permissions.includes(WorkspacePermission.MANAGE_MEMBERS as any),
          deleteMembers: permissions.includes(WorkspacePermission.MANAGE_MEMBERS as any),
          assignPermissionsToRoles: permissions.includes(WorkspacePermission.MANAGE_MEMBERS as any),
        }
      },
      funnels: {
        enabled: permissions.some(p =>
          [WorkspacePermission.CREATE_FUNNELS, WorkspacePermission.EDIT_FUNNELS,
           WorkspacePermission.DELETE_FUNNELS, WorkspacePermission.VIEW_ANALYTICS].includes(p as any)
        ),
        permissions: {
          createNewFunnel: permissions.includes(WorkspacePermission.CREATE_FUNNELS as any),
          viewFunnel: true, // Always true if they have access to workspace
          editFunnel: permissions.includes(WorkspacePermission.EDIT_FUNNELS as any),
          viewAnalytics: permissions.includes(WorkspacePermission.VIEW_ANALYTICS as any),
          shareFunnel: permissions.includes(WorkspacePermission.EDIT_FUNNELS as any),
          rename: permissions.includes(WorkspacePermission.EDIT_FUNNELS as any),
          duplicate: permissions.includes(WorkspacePermission.CREATE_FUNNELS as any),
          archive: permissions.includes(WorkspacePermission.EDIT_FUNNELS as any),
          restoreArchivedFunnels: permissions.includes(WorkspacePermission.EDIT_FUNNELS as any),
          moveFunnel: permissions.includes(WorkspacePermission.EDIT_FUNNELS as any),
          deleteFunnel: permissions.includes(WorkspacePermission.DELETE_FUNNELS as any),
        }
      },
      domains: {
        enabled: permissions.some(p =>
          [WorkspacePermission.MANAGE_DOMAINS, WorkspacePermission.CREATE_DOMAINS,
           WorkspacePermission.DELETE_DOMAINS].includes(p as any)
        ),
        permissions: {
          addDomain: permissions.includes(WorkspacePermission.CREATE_DOMAINS as any) ||
                     permissions.includes(WorkspacePermission.CONNECT_DOMAINS as any),
          deleteDomain: permissions.includes(WorkspacePermission.DELETE_DOMAINS as any),
          manageDomain: permissions.includes(WorkspacePermission.MANAGE_DOMAINS as any),
        }
      }
    };
  }

  static async getBySlug(
    userId: number,
    slug: string
  ): Promise<GetWorkspaceResponse> {
    try {
      // Validate input
      const validatedParams = getWorkspaceParams.parse({ slug });
      
      const prisma = getPrisma();
      
      // Get workspace with all related data
      const workspace = await prisma.workspace.findUnique({
        where: { slug: validatedParams.slug },
        include: {
          // Owner info
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

          // All members
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

          // Domains
          domains: true,

          // Funnels (summary)
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
      const userMember = workspace.members.find(member => member.userId === userId);
      
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
              WorkspacePermission.CONNECT_DOMAINS
            ],
            joinedAt: workspace.createdAt,
          }
        : {
            role: userMember!.role,
            permissions: userMember!.permissions,
            joinedAt: userMember!.joinedAt,
          };

      // Calculate usage statistics
      const usage = {
        funnelsUsed: workspace.funnels.length,
        customDomainsUsed: workspace.domains.filter(d => d.type === 'CUSTOM_DOMAIN').length,
        subdomainsUsed: workspace.domains.filter(d => d.type === 'SUBDOMAIN').length,
        totalDomains: workspace.domains.length,
        membersCount: workspace.members.length + 1, // +1 for owner
        activeFunnels: workspace.funnels.filter(f => f.status === FunnelStatus.LIVE).length,
        draftFunnels: workspace.funnels.filter(f => f.status === FunnelStatus.DRAFT).length,
        archivedFunnels: workspace.funnels.filter(f => f.status === FunnelStatus.ARCHIVED).length,
      };

      // Define limits based on owner's plan
      const planLimits = {
        FREE: { maxFunnels: 3, maxDomains: 1 },
        BUSINESS: { maxFunnels: 10, maxDomains: 5 },
        AGENCY: { maxFunnels: 50, maxDomains: 20 },
      };

      const userPlanLimits = planLimits[workspace.owner.plan] || planLimits.FREE;

      const limits = {
        maxFunnels: userPlanLimits.maxFunnels,
        maxDomains: userPlanLimits.maxDomains,
        maxMembers: 50, // Default max members per workspace
        maxStorage: 5000, // 5GB in MB
        funnelsRemaining: Math.max(0, userPlanLimits.maxFunnels - workspace.funnels.length),
        domainsRemaining: Math.max(0, userPlanLimits.maxDomains - workspace.domains.length),
      };

      // Transform domains for response
      const domains = workspace.domains.map(domain => ({
        id: domain.id,
        hostname: domain.hostname,
        type: domain.type,
        status: domain.status,
        sslStatus: domain.sslStatus,
        isVerified: domain.status === 'ACTIVE' || domain.status === 'VERIFIED',
        isActive: domain.status === 'ACTIVE',
        createdAt: domain.createdAt,
        updatedAt: domain.updatedAt,
      }));

      // Transform funnels for response
      const funnels = workspace.funnels.map(funnel => ({
        id: funnel.id,
        name: funnel.name,
        slug: funnel.slug,
        status: funnel.status,
        createdAt: funnel.createdAt,
        updatedAt: funnel.updatedAt,
        pagesCount: funnel._count.pages,
      }));

      // Generate permission groups for each role
      const rolePermissions = {
        [WorkspaceRole.OWNER]: this.generatePermissionGroups(WorkspaceRole.OWNER),
        [WorkspaceRole.ADMIN]: this.generatePermissionGroups(WorkspaceRole.ADMIN),
        [WorkspaceRole.EDITOR]: this.generatePermissionGroups(WorkspaceRole.EDITOR),
        [WorkspaceRole.VIEWER]: this.generatePermissionGroups(WorkspaceRole.VIEWER),
      };

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
        members: workspace.members,
        domains,
        funnels,
        usage,
        limits,
        rolePermissions,
      };

      return getWorkspaceResponse.parse(response);

    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid data provided";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}