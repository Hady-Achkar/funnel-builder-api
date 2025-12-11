import {
  DeleteTemplateRequest,
  DeleteTemplateResponse,
  deleteTemplateResponse,
} from "../../../types/template/delete";
import { getPrisma } from "../../../lib/prisma";
import { cacheService } from "../../../services/cache/cache.service";
import { azureBlobStorageService } from "../../../services/azure-blob-storage.service";
import { NotFoundError, ForbiddenError } from "../../../errors";

/**
 * Extracts the blob path from an Azure blob URL
 * Example URL: https://account.blob.core.windows.net/container/templates/filename.jpg
 * Returns: templates/filename.jpg
 */
const extractBlobPathFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    // Remove leading slash and container name from pathname
    // pathname looks like: /container/templates/filename.jpg
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    // Skip the container name (first part) and join the rest
    if (pathParts.length > 1) {
      return pathParts.slice(1).join("/");
    }
    return null;
  } catch {
    return null;
  }
};

export const deleteTemplate = async (
  params: DeleteTemplateRequest
): Promise<DeleteTemplateResponse> => {
  const { templateSlug, isAdmin } = params;

  // Check admin permission
  if (!isAdmin) {
    throw new ForbiddenError("Only administrators can delete templates");
  }

  const prisma = getPrisma();

  // Find template by slug with images
  const template = await prisma.template.findUnique({
    where: { slug: templateSlug },
    include: {
      previewImages: {
        select: {
          id: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!template) {
    throw new NotFoundError("Template not found");
  }

  // Delete images from Azure blob storage (non-blocking errors)
  for (const image of template.previewImages) {
    try {
      const blobPath = extractBlobPathFromUrl(image.imageUrl);
      if (blobPath) {
        await azureBlobStorageService.deleteFile(blobPath);
      }
    } catch (azureError) {
      console.warn(
        `Failed to delete image from Azure (ID: ${image.id}):`,
        azureError
      );
    }
  }

  // Delete template (cascade will handle TemplateImage and TemplatePage)
  await prisma.template.delete({
    where: { id: template.id },
  });

  // Invalidate cache
  try {
    await cacheService.invalidateTemplateCache(template.id);
    await cacheService.del("templates:ids:all");
  } catch (cacheError) {
    console.warn(
      `Template cache invalidation failed but template was deleted:`,
      cacheError
    );
  }

  const response = {
    message: "Template deleted successfully",
    deletedTemplateSlug: templateSlug,
  };

  return deleteTemplateResponse.parse(response);
};
