import { cacheService } from "../../cache/cache.service";
import { azureBlobStorageService } from "../../azure-blob-storage.service";
import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import { ZodError } from "zod";
import {
  bulkDeleteImagesRequest,
  BulkDeleteImagesRequest,
  bulkDeleteImagesResponse,
  BulkDeleteImagesResponse,
} from "../../../types/image/bulk-delete";

export const bulkDeleteImages = async (
  userId: number,
  request: BulkDeleteImagesRequest
): Promise<BulkDeleteImagesResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const validatedRequest = bulkDeleteImagesRequest.parse(request);
    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundError("User not found");

    const images = await prisma.image.findMany({
      where: {
        id: { in: validatedRequest.imageIds },
      },
      include: { folder: true },
    });

    if (images.length === 0) {
      throw new NotFoundError("No images found with the provided IDs");
    }

    const unauthorizedImages = images.filter(
      (img) => img.folder?.userId !== userId
    );
    if (unauthorizedImages.length > 0) {
      throw new UnauthorizedError(
        `Unauthorized to delete ${unauthorizedImages.length} image(s)`
      );
    }

    const deletedIds: number[] = [];
    const failedIds: number[] = [];
    const errors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const image of images) {
        try {
          try {
            const urlParts = image.url.split("/");
            const fileName = urlParts[urlParts.length - 1];
            const folderPath = `images/user-${userId}/folder-${image.folderId}`;

            await azureBlobStorageService.deleteFile(
              `${folderPath}/${fileName}`
            );
          } catch (azureError) {
            console.warn(
              `Failed to delete from Azure for image ${image.id}:`,
              azureError
            );
          }

          await tx.image.delete({
            where: { id: image.id },
          });

          deletedIds.push(image.id);
        } catch (error) {
          failedIds.push(image.id);
          errors.push(
            `Failed to delete image ${image.id}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }
    });

    const affectedFolders = new Set(images.map((img) => img.folderId!));
    await updateCachesForFolders(
      userId,
      Array.from(affectedFolders),
      deletedIds,
      prisma
    );

    const response = {
      message: `Successfully deleted ${deletedIds.length} image(s)`,
      deletedCount: deletedIds.length,
      ...(failedIds.length > 0 && { failedIds }),
      ...(errors.length > 0 && { errors }),
    };

    return bulkDeleteImagesResponse.parse(response);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};

const updateCachesForFolders = async (
  userId: number,
  folderIds: number[],
  deletedImageIds: number[],
  prisma: any
) => {
  try {
    await Promise.all(
      folderIds.map(async (folderId) => {
        try {
          const cachedData = await cacheService.getUserFolderCache(
            userId,
            folderId,
            "full"
          );

          if (cachedData && typeof cachedData === "object") {
            const folderData = cachedData as any;
            const updatedFolderData = {
              ...folderData,
              images: (folderData.images || []).filter(
                (img: any) => !deletedImageIds.includes(img.id)
              ),
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
        } catch (folderCacheError) {
          console.warn(
            `Cache update failed for folder ${folderId}:`,
            folderCacheError
          );
        }
      })
    );
  } catch (cacheError) {
    console.warn("Cache update failed but images were deleted:", cacheError);
  }
};