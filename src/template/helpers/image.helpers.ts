import { BadRequestError } from "../../errors";
import { azureBlobStorageService } from "../../services/azure-blob-storage.service";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export interface ImageUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
}

export interface UploadedImage {
  url: string;
  fileName: string;
  size: number;
  contentType: string;
}

/**
 * Validates image file size and type
 * @param file - Multer file object
 * @param options - Optional validation options
 * @throws BadRequestError if validation fails
 */
export function validateImageFile(
  file: Express.Multer.File,
  options: ImageUploadOptions = {}
): void {
  const maxSize = options.maxSize || MAX_FILE_SIZE;
  const allowedTypes = options.allowedTypes || ALLOWED_MIME_TYPES;

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    throw new BadRequestError(
      `File size exceeds maximum allowed size of ${maxSizeMB}MB`
    );
  }

  // Check file type
  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestError(
      `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
    );
  }

  // Additional check for file extension
  const fileExtension = file.originalname.split(".").pop()?.toLowerCase();
  const validExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

  if (!fileExtension || !validExtensions.includes(fileExtension)) {
    throw new BadRequestError("Invalid file extension");
  }
}

/**
 * Uploads a single template thumbnail image to Azure Blob Storage
 * @param file - Multer file object
 * @param templateId - Template ID for organizing files
 * @param imageType - Type of image (thumbnail, preview, etc.)
 * @returns Promise with upload result
 */
export async function uploadTemplateThumbnail(
  file: Express.Multer.File,
  templateId: number,
  imageType: string = "thumbnail"
): Promise<UploadedImage> {
  // Validate file first
  validateImageFile(file);

  // Check if Azure is configured
  if (!azureBlobStorageService.isConfigured()) {
    throw new BadRequestError("Image storage service is not configured");
  }

  try {
    const uploadResult = await azureBlobStorageService.uploadBuffer(
      file.buffer,
      {
        fileName: azureBlobStorageService.generateFileName(
          file.originalname,
          templateId,
          imageType
        ),
        contentType: file.mimetype,
        folder: `templates/${templateId}/images`,
      }
    );

    return {
      url: uploadResult.url,
      fileName: uploadResult.fileName,
      size: uploadResult.size,
      contentType: uploadResult.contentType,
    };
  } catch (error: any) {
    console.error("Image upload failed:", error);
    throw new BadRequestError(
      `Failed to upload image: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Uploads multiple preview images for a template
 * @param files - Array of Multer file objects
 * @param templateId - Template ID for organizing files
 * @returns Promise with array of upload results
 */
export async function uploadTemplatePreviewImages(
  files: Express.Multer.File[],
  templateId: number
): Promise<UploadedImage[]> {
  if (!files || files.length === 0) {
    return [];
  }

  // Validate all files first
  files.forEach((file) => validateImageFile(file));

  // Check if Azure is configured
  if (!azureBlobStorageService.isConfigured()) {
    throw new BadRequestError("Image storage service is not configured");
  }

  const uploadPromises = files.map(async (file, index) => {
    try {
      const uploadResult = await azureBlobStorageService.uploadBuffer(
        file.buffer,
        {
          fileName: azureBlobStorageService.generateFileName(
            file.originalname,
            templateId,
            `preview-${index + 1}`
          ),
          contentType: file.mimetype,
          folder: `templates/${templateId}/images`,
        }
      );

      return {
        url: uploadResult.url,
        fileName: uploadResult.fileName,
        size: uploadResult.size,
        contentType: uploadResult.contentType,
      };
    } catch (error: any) {
      console.error(`Failed to upload preview image ${index + 1}:`, error);
      throw new BadRequestError(
        `Failed to upload preview image ${index + 1}: ${
          error.message || "Unknown error"
        }`
      );
    }
  });

  return Promise.all(uploadPromises);
}

/**
 * Deletes an image from Azure Blob Storage
 * @param fileName - The file name/path to delete
 */
export async function deleteTemplateImage(fileName: string): Promise<void> {
  if (!azureBlobStorageService.isConfigured()) {
    console.warn("Image storage service is not configured, skipping deletion");
    return;
  }

  try {
    await azureBlobStorageService.deleteFile(fileName);
  } catch (error: any) {
    console.error("Image deletion failed:", error);
    // Don't throw error for deletion failures, just log them
  }
}
