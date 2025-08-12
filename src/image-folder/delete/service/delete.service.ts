import {
  DeleteImageFolderRequest,
  DeleteImageFolderResponse,
  deleteImageFolderResponse,
} from "../types";
import { cacheService } from "../../../services/cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import { UnauthorizedError, NotFoundError } from "../../../errors";

export const deleteImageFolder = async (
  userId: number,
  request: DeleteImageFolderRequest
): Promise<DeleteImageFolderResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const prisma = getPrisma();

    const existingFolder = await prisma.imageFolder.findFirst({
      where: {
        id: request.id,
        userId,
      },
    });

    if (!existingFolder) {
      throw new NotFoundError("Folder not found or you don't have access");
    }

    await prisma.$transaction(async (tx) => {
      await tx.image.deleteMany({
        where: { folderId: request.id },
      });

      await tx.imageFolder.delete({
        where: { id: request.id },
      });
    });

    const response = {
      message: "Deleted successfully",
    };

    const validatedResponse = deleteImageFolderResponse.parse(response);

    try {
      const fullCacheKey = `user:${userId}:folder:${request.id}:full`;
      await cacheService.del(fullCacheKey);

      const allFolders = await prisma.imageFolder.findMany({
        where: { userId },
        include: {
          _count: {
            select: { images: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const formattedFolders = allFolders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        userId: folder.userId,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        imageCount: folder._count.images,
      }));

      const summaryResponse = {
        folders: formattedFolders,
      };

      const summaryCacheKey = `user:${userId}:folders:summary`;
      await cacheService.set(summaryCacheKey, summaryResponse, { ttl: 300 });
    } catch (cacheError) {
      console.warn("Cache update failed but folder was deleted:", cacheError);
    }

    return validatedResponse;
  } catch (error) {
    throw error;
  }
};
