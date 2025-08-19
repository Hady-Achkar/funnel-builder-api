import { cacheService } from "../../../services/cache/cache.service";
import { azureBlobStorageService } from "../../../services/azure-blob-storage.service";
import { getPrisma } from "../../../lib/prisma";
import { BadRequestError, UnauthorizedError, NotFoundError } from "../../../errors";
import { ZodError } from "zod";
import {
  deleteImageRequest,
  DeleteImageRequest,
  deleteImageResponse,
  DeleteImageResponse,
} from "../types/delete.types";

export const deleteImage = async (
  userId: number,
  params: DeleteImageRequest
): Promise<DeleteImageResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedParams = deleteImageRequest.parse(params);
    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundError("User not found");

    const image = await prisma.image.findUnique({
      where: { id: validatedParams.imageId },
      include: { folder: true },
    });

    if (!image) throw new NotFoundError("Image not found");
    if (image.folder?.userId !== userId) throw new UnauthorizedError("Unauthorized to delete this image");

    try {
      const urlParts = image.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const folderPath = `images/user-${userId}/folder-${image.folderId}`;
      
      await azureBlobStorageService.deleteFile(`${folderPath}/${fileName}`);
    } catch (azureError) {
      console.warn("Failed to delete from Azure:", azureError);
    }

    await prisma.image.delete({
      where: { id: validatedParams.imageId },
    });

    await updateCache(userId, image.folderId!, validatedParams.imageId, prisma);

    const response = { message: "Image deleted successfully" };
    return deleteImageResponse.parse(response);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};

const updateCache = async (userId: number, folderId: number, deletedImageId: number, prisma: any) => {
  try {
    const cachedData = await cacheService.getUserFolderCache(userId, folderId, "full");

    if (cachedData && typeof cachedData === "object") {
      const folderData = cachedData as any;
      const updatedFolderData = {
        ...folderData,
        images: (folderData.images || []).filter((img: any) => img.id !== deletedImageId),
      };

      await cacheService.setUserFolderCache(
        userId,
        folderId,
        "full",
        updatedFolderData
      );
    } else {
      const folderData = await prisma.imageFolder.findUnique({
        where: { id: folderId, userId },
        include: { images: { orderBy: { createdAt: "desc" } } },
      });

      if (folderData) {
        await cacheService.setUserFolderCache(
          userId,
          folderId,
          "full",
          folderData
        );
      }
    }
  } catch (cacheError) {
    console.warn("Cache update failed but image was deleted:", cacheError);
  }
};