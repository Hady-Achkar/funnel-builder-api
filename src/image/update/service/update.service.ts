import { cacheService } from "../../../services/cache/cache.service";
import { azureBlobStorageService } from "../../../services/azure-blob-storage.service";
import { getPrisma } from "../../../lib/prisma";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
} from "../../../errors";
import { ZodError } from "zod";
import path from "path";
import {
  updateImageRequest,
  UpdateImageRequest,
  updateImageFormData,
  UpdateImageFormData,
  updateImageResponse,
  UpdateImageResponse,
} from "../types/update.types";

export const updateImage = async (
  userId: number,
  params: UpdateImageRequest,
  formData: UpdateImageFormData,
  file?: Express.Multer.File
): Promise<UpdateImageResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    if (file) {
      const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
      ];

      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestError(
          `Invalid file type: ${file.mimetype}. Only image files are allowed.`
        );
      }
      if (file.size > maxSize) {
        throw new BadRequestError(`File exceeds 5MB limit.`);
      }
    }

    const validatedParams = updateImageRequest.parse(params);
    const validatedFormData = updateImageFormData.parse(formData);
    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundError("User not found");

    const existingImage = await prisma.image.findUnique({
      where: { id: validatedParams.imageId },
      include: { folder: true },
    });

    if (!existingImage) throw new NotFoundError("Image not found");
    if (existingImage.folder?.userId !== userId)
      throw new UnauthorizedError("Unauthorized to update this image");

    let updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedFormData.name !== undefined) {
      updateData.name = validatedFormData.name;
    }

    if (validatedFormData.altText !== undefined) {
      updateData.altText = validatedFormData.altText;
    }

    if (file) {
      const urlParts = existingImage.url.split("/");
      const containerIndex = urlParts.findIndex(part => part === 'template-images');
      const blobPath = urlParts.slice(containerIndex + 1).join("/");
      
      await azureBlobStorageService.overwriteFileAtExactPath(blobPath, file.buffer, file.mimetype);

      updateData.size = file.size;
      if (!validatedFormData.name) {
        updateData.name = file.originalname;
      }
    }

    const updatedImage = await prisma.image.update({
      where: { id: validatedParams.imageId },
      data: updateData,
    });

    await updateCache(userId, existingImage.folderId!, updatedImage, prisma);

    const response = { message: "Image updated successfully" };
    return updateImageResponse.parse(response);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};

const updateCache = async (
  userId: number,
  folderId: number,
  updatedImage: any,
  prisma: any
) => {
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
        images: (folderData.images || []).map((img: any) =>
          img.id === updatedImage.id ? updatedImage : img
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
  } catch (cacheError) {
    console.warn("Cache update failed but image was updated:", cacheError);
  }
};
