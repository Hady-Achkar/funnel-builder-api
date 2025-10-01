import { getPrisma } from "../../../lib/prisma";
import { $Enums, MembershipStatus } from "../../../generated/prisma-client";
import {
  getAllWorkspacesResponse,
  GetAllWorkspacesResponse,
  getAllWorkspacesRequest,
  GetAllWorkspacesRequest,
} from "../../../types/workspace/get-all";
import { BadRequestError } from "../../../errors/http-errors";
import { ZodError } from "zod";

export const getAllWorkspaces = async (
  userId: number,
  requestData?: Partial<GetAllWorkspacesRequest>
): Promise<GetAllWorkspacesResponse> => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    const { search, page, limit, sortBy, sortOrder, role } =
      getAllWorkspacesRequest.parse(requestData || {});

    const prisma = getPrisma();

    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId: userId,
                status: MembershipStatus.ACTIVE,
              },
            },
          },
        ],
        ...(search && {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        ownerId: true,
        createdAt: true,
        members: {
          select: {
            userId: true,
            role: true,
            permissions: true,
            status: true,
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
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
          },
        },
        _count: {
          select: {
            funnels: true,
            members: true,
            domains: true,
          },
        },
      },
    });

    // Process and format workspaces
    let result = workspaces.map((workspace) => {
      const isOwner = workspace.ownerId === userId;

      // Get current user's role and permissions
      let currentUserRole: $Enums.WorkspaceRole;
      let currentUserPermissions: $Enums.WorkspacePermission[] = [];

      if (isOwner) {
        currentUserRole = $Enums.WorkspaceRole.OWNER;
        // Owner has all permissions
        currentUserPermissions = Object.values($Enums.WorkspacePermission);
      } else {
        const currentUserMember = workspace.members.find(
          (m) => m.userId === userId
        );
        if (currentUserMember) {
          currentUserRole = currentUserMember.role;
          currentUserPermissions = currentUserMember.permissions || [];
        } else {
          currentUserRole = $Enums.WorkspaceRole.VIEWER;
        }
      }

      // Format members list (including owner)
      const membersList = [
        {
          id: workspace.owner.id,
          firstName: workspace.owner.firstName,
          lastName: workspace.owner.lastName,
          email: workspace.owner.email,
          username: workspace.owner.username,
          role: $Enums.WorkspaceRole.OWNER,
          permissions: Object.values($Enums.WorkspacePermission),
          status: MembershipStatus.ACTIVE, // Owner is always active
        },
        ...workspace.members
          .filter(
            (m) =>
              m.userId !== workspace.ownerId &&
              m.status === MembershipStatus.ACTIVE
          )
          .map((member) => {
            if (member.user) {
              return {
                id: member.user.id,
                firstName: member.user.firstName,
                lastName: member.user.lastName,
                email: member.user.email,
                username: member.user.username,
                role: member.role,
                permissions: member.permissions || [],
                status: member.status,
              };
            }
            return null;
          })
          .filter(Boolean),
      ];

      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        image: workspace.image,
        role: currentUserRole,
        permissions: currentUserPermissions,
        owner: workspace.owner,
        members: membersList,
        memberCount: membersList.length,
        funnelCount: workspace._count.funnels,
        domainCount: workspace._count.domains,
        createdAt: workspace.createdAt,
      };
    });

    // Filter by role if specified
    if (role) {
      result = result.filter((w) => w.role === role);
    }

    // Sort workspaces
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "memberCount":
          comparison = a.memberCount - b.memberCount;
          break;
        case "funnelCount":
          comparison = a.funnelCount - b.funnelCount;
          break;
        case "domainCount":
          comparison = a.domainCount - b.domainCount;
          break;
        case "createdAt":
        default:
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    // Calculate pagination
    const total = result.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = result.slice(startIndex, endIndex);

    const pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return getAllWorkspacesResponse.parse({
      workspaces: paginatedResults,
      pagination,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
