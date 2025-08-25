import {
  DeleteImageFolderRequest,
  DeleteImageFolderResponse,
  deleteImageFolderResponse,
} from "../types";
import { cacheService } from "../../../services/cache/cache.service";
import { azureBlobStorageService } from "../../../services/azure-blob-storage.service";
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
      include: {
        images: true, // Include images to get their URLs for Azure deletion
      },
    });

    if (!existingFolder) {
      throw new NotFoundError("Folder not found or you don't have access");
    }

    // Delete images from Azure Blob Storage before deleting from database
    if (existingFolder.images && existingFolder.images.length > 0) {
      console.log(`Deleting ${existingFolder.images.length} images from Azure Blob Storage...`);
      
      for (const image of existingFolder.images) {
        try {
          const urlParts = image.url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const folderPath = `images/user-${userId}/folder-${image.folderId}`;
          
          await azureBlobStorageService.deleteFile(`${folderPath}/${fileName}`);
          console.log(`Deleted image from Azure: ${fileName}`);
        } catch (azureError) {
          console.warn(`Failed to delete image ${image.id} from Azure:`, azureError);
          // Continue with other deletions even if one fails
        }
      }
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
      await cacheService.set(summaryCacheKey, summaryResponse, { ttl: 0 });
    } catch (cacheError) {
      console.warn("Cache update failed but folder was deleted:", cacheError);
    }

    return validatedResponse;
  } catch (error) {
    throw error;
  }
};
