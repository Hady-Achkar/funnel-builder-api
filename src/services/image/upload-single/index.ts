import { getPrisma } from "../../../lib/prisma";
import { azureBlobStorageService } from "../../azure-blob-storage.service";
import {
  BadRequestError,
  UnauthorizedError,
  InternalServerError
} from "../../../errors/http-errors";
import { validateImageFile, getFileExtension } from "../../../controllers/image/upload-single/utils/validation.utils";
import { buildAzurePath, generateUniqueFileName } from "../../../controllers/image/upload-single/utils/azure.utils";
import { UploadSingleImageResponse } from "../../../types/image/upload-single";

export async function uploadSingleImage(
  userId: number,
  file: Express.Multer.File
): Promise<UploadSingleImageResponse> {
  // Validate userId
  if (!userId) {
    throw new UnauthorizedError("User ID is required");
  }

  // Validate file
  validateImageFile(file);

  const prisma = getPrisma();

  // Get user to retrieve email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  // Check if Azure storage is configured
  if (!azureBlobStorageService.isConfigured()) {
    throw new BadRequestError("Image storage service is not configured");
  }

  try {
    // Prepare file upload
    const fileExtension = getFileExtension(file.originalname);
    const fileName = generateUniqueFileName(fileExtension);
    const folderPath = buildAzurePath(user.email);

    // Upload to Azure
    const uploadResult = await azureBlobStorageService.uploadBuffer(
      file.buffer,
      {
        fileName,
        contentType: file.mimetype,
        folder: folderPath,
      }
    );

    // Return success message and URL
    return {
      message: "Image uploaded successfully",
      url: uploadResult.url,
    };
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof UnauthorizedError) {
      throw error;
    }
    console.error("Upload error:", error);
    throw new InternalServerError("Failed to upload image");
  }
}