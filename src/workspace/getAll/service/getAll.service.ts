import { getPrisma } from "../../../lib/prisma";
import { $Enums } from "../../../generated/prisma-client";
import {
  getAllWorkspacesResponse,
  GetAllWorkspacesResponse,
} from "../types/getAll.types";

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
        ownerId: true,
        members: {
          where: { userId: userId },
          select: { role: true },
        },
      },
    });

    const result = workspaces.map((workspace) => {
      if (workspace.ownerId === userId) {
        return {
          id: workspace.id,
          name: workspace.name,
          role: $Enums.WorkspaceRole.OWNER,
        };
      }

      const memberRole =
        workspace.members[0]?.role || $Enums.WorkspaceRole.VIEWER;
      return {
        id: workspace.id,
        name: workspace.name,
        role: memberRole,
      };
    });

    return getAllWorkspacesResponse.parse(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to get workspaces: ${error.message}`);
    }
    throw new Error("Couldn't retrieve workspaces. Please try again.");
  }
};
