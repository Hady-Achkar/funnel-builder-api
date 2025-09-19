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
      include: {
        members: {
          where: { userId: userId },
          select: { role: true },
        },
        owner: true,
        _count: {
          select: { funnels: true },
        },
      },
    });

    const result = workspaces.map((workspace) => {
      if (workspace.ownerId === userId) {
        return {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          role: $Enums.WorkspaceRole.OWNER,
          funnelsCount: workspace._count.funnels,
        };
      }

      const memberRole =
        workspace.members[0]?.role || $Enums.WorkspaceRole.VIEWER;
      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role: memberRole,
        funnelsCount: workspace._count.funnels,
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
