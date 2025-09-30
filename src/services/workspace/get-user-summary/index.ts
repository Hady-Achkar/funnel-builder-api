import { getPrisma } from "../../../lib/prisma";
import { $Enums, MembershipStatus } from "../../../generated/prisma-client";
import {
  WorkspaceSummary,
} from "../../../types/workspace/get-user-summary/get-user-summary.types";

export class GetUserWorkspacesSummaryService {
  static async getUserWorkspacesSummary(userId: number): Promise<WorkspaceSummary[]> {
    if (!userId) {
      throw new Error("User ID is required");
    }

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
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        ownerId: true,
        members: {
          where: {
            userId: userId,
          },
          select: {
            role: true,
            status: true,
          },
        },
      },
    });

    const result: WorkspaceSummary[] = workspaces.map((workspace) => {
      const isOwner = workspace.ownerId === userId;

      let currentUserRole: $Enums.WorkspaceRole;

      if (isOwner) {
        currentUserRole = $Enums.WorkspaceRole.OWNER;
      } else {
        const currentUserMember = workspace.members.find(
          (m) => m.status === MembershipStatus.ACTIVE
        );
        currentUserRole = currentUserMember?.role || $Enums.WorkspaceRole.VIEWER;
      }

      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        image: workspace.image,
        role: currentUserRole,
      };
    });

    return result;
  }
}