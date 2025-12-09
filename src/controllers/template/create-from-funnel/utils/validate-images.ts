import { TemplateImageType } from "../../../../generated/prisma-client";
import { TemplateImageInput } from "../../../../types/template/create-from-funnel";

interface ImageValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validates the images array for template creation.
 * - Exactly one THUMBNAIL is required
 * - Multiple PREVIEW images are allowed
 */
export function validateImages(
  images: TemplateImageInput[]
): ImageValidationResult {
  const thumbnailCount = images.filter(
    (img) => img.imageType === TemplateImageType.THUMBNAIL
  ).length;

  if (thumbnailCount === 0) {
    return {
      isValid: false,
      error: "A thumbnail image is required",
    };
  }

  if (thumbnailCount > 1) {
    return {
      isValid: false,
      error: "Only one thumbnail image is allowed per template",
    };
  }

  return {
    isValid: true,
    error: null,
  };
}
