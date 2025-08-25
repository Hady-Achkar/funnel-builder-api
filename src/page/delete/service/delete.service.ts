import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import {
  DeletePageResponse,
  deletePageRequest,
  deletePageResponse,
} from "../types";
import { checkPageDeletePermission, updateCacheAfterDelete } from "../helpers";
import { BadRequestError, UnauthorizedError } from "../../../errors";

export const deletePage = async (
  userId: number,
  requestBody: Record<string, unknown>
): Promise<DeletePageResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = deletePageRequest.parse(requestBody);

    const permissionResult = await checkPageDeletePermission(
      userId,
      validatedRequest.pageId
    );

    const prisma = getPrisma();

    await prisma.$transaction(async (tx) => {
      await tx.page.delete({
        where: { id: validatedRequest.pageId },
      });

      const pagesToReorder = await tx.page.findMany({
        where: {
          funnelId: permissionResult.funnelId,
          order: { gt: permissionResult.pageOrder },
        },
        orderBy: { order: "asc" },
      });

      if (pagesToReorder.length > 0) {
        await Promise.all(
          pagesToReorder.map((page) =>
            tx.page.update({
              where: { id: page.id },
              data: { order: page.order - 1 },
            })
          )
        );
      }
    });

    await updateCacheAfterDelete({
      workspaceId: permissionResult.workspaceId,
      funnelId: permissionResult.funnelId,
      pageId: validatedRequest.pageId,
      deletedPageOrder: permissionResult.pageOrder,
    });

    const response: DeletePageResponse = {
      message: "Page deleted successfully",
    };

    return deletePageResponse.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};
