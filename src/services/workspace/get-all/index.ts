import { getPrisma } from "../../../lib/prisma";
import { $Enums } from "../../../generated/prisma-client";
import {
  getAllWorkspacesResponse,
  GetAllWorkspacesResponse,
} from "../../../types/workspace/get-all";
import { BadRequestError } from "../../../errors/http-errors";
import { ZodError } from "zod";

export const getAllWorkspaces = async (
  userId: number
): Promise<GetAllWorkspacesResponse> => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const prisma = getPrisma();

    const workspaces = await prisma.workspace.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId: userId } } }],
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

    const result = workspaces.map((workspace) => {
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
        },
        ...workspace.members
          .filter((m) => m.userId !== workspace.ownerId)
          .map((member) => ({
            id: member.user.id,
            firstName: member.user.firstName,
            lastName: member.user.lastName,
            email: member.user.email,
            username: member.user.username,
            role: member.role,
            permissions: member.permissions || [],
          })),
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

    return getAllWorkspacesResponse.parse(result);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
