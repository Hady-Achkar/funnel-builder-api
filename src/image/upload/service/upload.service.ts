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
  uploadImagesRequest,
  UploadImagesRequest,
  uploadImagesResponse,
  UploadImagesResponse,
} from "../types/upload.types";

export const uploadImages = async (
  userId: number,
  params: UploadImagesRequest,
  files: Express.Multer.File[]
): Promise<UploadImagesResponse> => {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");
    if (!files || files.length === 0)
      throw new BadRequestError("No files provided");

    if (files.length > 10) {
      throw new BadRequestError("Maximum 10 images can be uploaded at once");
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];

    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestError(
          `Invalid file type: ${file.mimetype}. Only image files are allowed.`
        );
      }
      if (file.size > maxSize) {
        throw new BadRequestError(
          `File ${file.originalname} exceeds 5MB limit.`
        );
      }
    }

    const validatedParams = uploadImagesRequest.parse(params);
    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundError("User not found");

    const folder = await prisma.imageFolder.findUnique({
      where: { id: validatedParams.folderId, userId },
    });
    if (!folder) throw new NotFoundError("Image folder not found");

    let successCount = 0;
    const uploadedImages = [];

    for (const file of files) {
      try {
        const originalName = file.originalname;
        const baseName = path.parse(originalName).name;
        const sanitizedBaseName = baseName
          .replace(/[^a-zA-Z0-9-_]/g, "-")
          .toLowerCase();
        const timestamp = Date.now();
        const uniqueId = Math.random().toString(36).substring(2, 9);
        const extension = path.extname(originalName);
        const fileName = `${sanitizedBaseName}-${timestamp}-${uniqueId}${extension}`;

        const uploadResult = await azureBlobStorageService.uploadBuffer(
          file.buffer,
          {
            fileName,
            contentType: file.mimetype,
            folder: `images/user-${userId}/folder-${validatedParams.folderId}`,
          }
        );

        const image = await prisma.image.create({
          data: {
            name: originalName,
            url: uploadResult.url,
            altText: null,
            size: file.size,
            folderId: validatedParams.folderId,
          },
        });

        uploadedImages.push(image);
        successCount++;
      } catch (fileError) {
        console.error(`Error uploading file ${file.originalname}:`, fileError);
      }
    }

    if (successCount === 0) {
      throw new BadRequestError("No valid images could be uploaded");
    }

    await updateCache(userId, validatedParams.folderId, uploadedImages, prisma);

    const response = {
      message:
        successCount === 1
          ? "Image uploaded successfully"
          : "Images uploaded successfully",
    };

    return uploadImagesResponse.parse(response);
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
  newImages: any[],
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
        images: [...newImages, ...(folderData.images || [])],
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
    console.warn("Cache update failed but image was uploaded:", cacheError);
  }
};
