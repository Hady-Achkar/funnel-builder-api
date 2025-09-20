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
import { WorkspaceRole, WorkspacePermission } from "../../../generated/prisma-client";

export class GetWorkspaceService {
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
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
          
          // Owner info
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              username: true,
            },
          },
          
          // All members
          members: {
            select: {
              id: true,
              userId: true,
              role: true,
              permissions: true,
              joinedAt: true,
              updatedAt: true,
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
          domains: {
            select: {
              id: true,
              hostname: true,
              type: true,
              status: true,
              sslStatus: true,
              lastVerifiedAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          
          // Funnels (summary)
          funnels: {
            select: {
              id: true,
              name: true,
              slug: true,
              status: true,
              createdAt: true,
              updatedAt: true,
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

      const response: GetWorkspaceResponse = {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        settings: workspace.settings,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
        owner: workspace.owner,
        currentUserMember,
        members: workspace.members,
        domains,
        funnels,
        usage,
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