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
 * @returns Promise with upload result
 */
export async function uploadTemplateThumbnail(
  file: Express.Multer.File,
  templateId: number
): Promise<UploadedImage> {
  // Validate file first (5MB limit for thumbnails)
  validateImageFile(file, { maxSize: 5 * 1024 * 1024 });

  // Check if Azure is configured
  if (!azureBlobStorageService.isConfigured()) {
    throw new BadRequestError("Image storage service is not configured");
  }

  try {
    // Generate unique file name
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.originalname.split(".").pop() || "jpg";
    const fileName = `template-${templateId}-thumbnail-${timestamp}-${randomString}.${fileExtension}`;

    const uploadResult = await azureBlobStorageService.uploadBuffer(
      file.buffer,
      {
        fileName: fileName,
        contentType: file.mimetype,
        folder: "template-thumbnails",
      }
    );

    return {
      url: uploadResult.url,
      fileName: uploadResult.fileName,
      size: uploadResult.size,
      contentType: uploadResult.contentType,
    };
  } catch (error: any) {
    console.error("Thumbnail upload failed:", error);
    throw new BadRequestError(
      `Failed to upload thumbnail: ${error.message || "Unknown error"}`
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

  // Validate number of files
  const MAX_PREVIEW_IMAGES = 10;
  if (files.length > MAX_PREVIEW_IMAGES) {
    throw new BadRequestError(
      `Maximum ${MAX_PREVIEW_IMAGES} preview images are allowed`
    );
  }

  // Validate all files first (10MB limit for preview images)
  files.forEach((file) => 
    validateImageFile(file, { maxSize: 10 * 1024 * 1024 })
  );

  // Check if Azure is configured
  if (!azureBlobStorageService.isConfigured()) {
    throw new BadRequestError("Image storage service is not configured");
  }

  const uploadPromises = files.map(async (file, index) => {
    try {
      // Generate unique file name
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.originalname.split(".").pop() || "jpg";
      const fileName = `template-${templateId}-preview-${index + 1}-${timestamp}-${randomString}.${fileExtension}`;

      const uploadResult = await azureBlobStorageService.uploadBuffer(
        file.buffer,
        {
          fileName: fileName,
          contentType: file.mimetype,
          folder: "template-previews",
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
