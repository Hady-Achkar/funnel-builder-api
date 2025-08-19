import {
  UpdateImageFolderParamsRequest,
  UpdateImageFolderRequest,
  UpdateImageFolderResponse,
  updateImageFolderResponse,
} from "../types";
import { cacheService } from "../../../services/cache/cache.service";
import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";

export const updateImageFolder = async (
  userId: number,
  paramsRequest: UpdateImageFolderParamsRequest,
  request: UpdateImageFolderRequest
): Promise<UpdateImageFolderResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const prisma = getPrisma();

    const existingFolder = await prisma.imageFolder.findFirst({
      where: {
        id: paramsRequest.id,
        userId,
      },
    });

    if (!existingFolder) {
      throw new NotFoundError("Folder not found or you don't have access");
    }

    const duplicateFolder = await prisma.imageFolder.findFirst({
      where: {
        userId,
        name: request.name,
        id: { not: paramsRequest.id },
      },
    });

    if (duplicateFolder) {
      throw new BadRequestError("A folder with this name already exists");
    }

    const updatedFolder = await prisma.imageFolder.update({
      where: { id: paramsRequest.id },
      data: {
        name: request.name,
        updatedAt: new Date(),
      },
      include: {
        images: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            url: true,
            createdAt: true,
          },
        },
      },
    });

    const response = {
      message: "Updated successfully",
    };

    const validatedResponse = updateImageFolderResponse.parse(response);

    try {
      const fullCacheData = {
        id: updatedFolder.id,
        name: updatedFolder.name,
        userId: updatedFolder.userId,
        createdAt: updatedFolder.createdAt,
        updatedAt: updatedFolder.updatedAt,
        images: updatedFolder.images,
      };

      const fullCacheKey = `user:${userId}:folder:${paramsRequest.id}:full`;
      await cacheService.set(fullCacheKey, fullCacheData, { ttl: 0 });

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
      await cacheService.set(summaryCacheKey, summaryResponse, { ttl: 0 });
    } catch (cacheError) {
      console.warn("Cache update failed but folder was updated:", cacheError);
    }

    return validatedResponse;
  } catch (error) {
    throw error;
  }
};
