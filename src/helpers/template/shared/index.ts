import { BadRequestError } from "../../../errors";
import { azureBlobStorageService } from "../../../services/azure-blob-storage.service";

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
export const validateImageFile = (
  file: Express.Multer.File,
  options: ImageUploadOptions = {}
): void => {
  const maxSize = options.maxSize || MAX_FILE_SIZE;
  const allowedTypes = options.allowedTypes || ALLOWED_MIME_TYPES;

  if (!file) {
    throw new BadRequestError("No file provided");
  }

  if (file.size > maxSize) {
    throw new BadRequestError(
      `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`
    );
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new BadRequestError(
      `Invalid file type. Allowed types are: ${allowedTypes.join(", ")}`
    );
  }
};

/**
 * Uploads a template thumbnail image
 * @param file - Multer file object
 * @param templateId - Template ID for folder structure
 * @returns Upload result with URL
 */
export const uploadTemplateThumbnail = async (
  file: Express.Multer.File,
  templateId: number
): Promise<UploadedImage> => {
  validateImageFile(file);

  const fileName = `template-${templateId}-thumbnail-${Date.now()}`;
  const containerName = "template-thumbnails";

  const result = await azureBlobStorageService.uploadBuffer(file.buffer, {
    fileName,
    contentType: file.mimetype,
    folder: containerName
  });

  return {
    url: result.url,
    fileName: result.fileName,
    size: file.size,
    contentType: file.mimetype,
  };
};

/**
 * Uploads multiple template preview images
 * @param files - Array of Multer file objects
 * @param templateId - Template ID for folder structure
 * @returns Array of upload results with URLs
 */
export const uploadTemplatePreviewImages = async (
  files: Express.Multer.File[],
  templateId: number
): Promise<UploadedImage[]> => {
  if (!files || files.length === 0) {
    throw new BadRequestError("No preview images provided");
  }

  if (files.length > 10) {
    throw new BadRequestError("Cannot upload more than 10 preview images");
  }

  // Validate all files first
  files.forEach((file, index) => {
    try {
      validateImageFile(file);
    } catch (error) {
      throw new BadRequestError(
        `Preview image ${index + 1}: ${error instanceof Error ? error.message : "Validation failed"}`
      );
    }
  });

  const containerName = "template-previews";
  const uploadPromises = files.map(async (file, index) => {
    const fileName = `template-${templateId}-preview-${index + 1}-${Date.now()}`;

    const result = await azureBlobStorageService.uploadBuffer(file.buffer, {
      fileName,
      contentType: file.mimetype,
      folder: containerName
    });

    return {
      url: result.url,
      fileName: result.fileName,
      size: file.size,
      contentType: file.mimetype,
    };
  });

  return Promise.all(uploadPromises);
};

/**
 * Deletes a template image from Azure Blob Storage
 * @param imageUrl - Full URL of the image to delete
 * @returns Promise resolving to success status
 */
export const deleteTemplateImage = async (imageUrl: string): Promise<boolean> => {
  try {
    await azureBlobStorageService.deleteFile(imageUrl);
    return true;
  } catch (error) {
    console.error("Failed to delete template image:", error);
    return false;
  }
};

export const generateShortUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};

export const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .replace(/^-+|-+$/g, ''); // Trim - from start and end
};

export const ensureUniqueSlug = async (prisma: any, baseSlug: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.template.findFirst({
      where: { slug }
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

export const replaceLinkingIdsInContent = (content: any, linkingIdMap: Map<string, string>): any => {
  if (typeof content === 'string') {
    let updatedContent = content;
    linkingIdMap.forEach((newId, oldId) => {
      updatedContent = updatedContent.replace(new RegExp(oldId, 'g'), newId);
    });
    return updatedContent;
  }
  
  if (typeof content === 'object' && content !== null) {
    if (Array.isArray(content)) {
      return content.map(item => replaceLinkingIdsInContent(item, linkingIdMap));
    } else {
      const updatedContent: any = {};
      for (const [key, value] of Object.entries(content)) {
        updatedContent[key] = replaceLinkingIdsInContent(value, linkingIdMap);
      }
      return updatedContent;
    }
  }
  
  return content;
};

export const validateTemplateData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push("Template name is required and must be a non-empty string");
  }
  
  if (data.name && data.name.length > 255) {
    errors.push("Template name must be less than 255 characters");
  }
  
  if (!data.categoryId || typeof data.categoryId !== 'number' || data.categoryId <= 0) {
    errors.push("Valid category ID is required");
  }
  
  if (data.tags && !Array.isArray(data.tags)) {
    errors.push("Tags must be an array");
  }
  
  if (data.tags && data.tags.length > 10) {
    errors.push("Cannot have more than 10 tags");
  }
  
  if (data.description && typeof data.description !== 'string') {
    errors.push("Description must be a string");
  }
  
  if (data.description && data.description.length > 1000) {
    errors.push("Description must be less than 1000 characters");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateTemplateId = (id: any): { isValid: boolean; error?: string } => {
  const numId = parseInt(id);
  
  if (isNaN(numId) || numId <= 0) {
    return {
      isValid: false,
      error: "Template ID must be a positive number"
    };
  }
  
  return { isValid: true };
};