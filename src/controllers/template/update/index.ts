import { Request, Response, NextFunction } from "express";
import { updateTemplate } from "../../../services/template/update";
import { updateTemplateRequestBody } from "../../../types/template/update";
import { BadRequestError } from "../../../errors";
import { 
  uploadTemplateThumbnail, 
  uploadTemplatePreviewImages 
} from "../../../helpers/template/shared";

export const updateTemplateController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    if (!id || isNaN(parseInt(id))) {
      throw new BadRequestError("Valid template ID is required");
    }

    const templateId = parseInt(id);

    let thumbnailUrl: string | undefined;
    let previewImageUrls: string[] | undefined;

    // Handle thumbnail upload
    if (files?.thumbnail?.[0]) {
      try {
        const uploadResult = await uploadTemplateThumbnail(files.thumbnail[0], templateId);
        thumbnailUrl = uploadResult.url;
      } catch (error) {
        console.error("Thumbnail upload failed:", error);
        throw new BadRequestError(`Thumbnail upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Handle preview images upload
    if (files?.images?.length) {
      try {
        const uploadResults = await uploadTemplatePreviewImages(files.images, templateId);
        previewImageUrls = uploadResults.map(result => result.url);
      } catch (error) {
        console.error("Preview images upload failed:", error);
        throw new BadRequestError(`Preview images upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const bodyData = {
      ...req.body,
      ...(thumbnailUrl !== undefined && { thumbnail: thumbnailUrl }),
      ...(previewImageUrls !== undefined && { images: previewImageUrls }),
    };

    const validatedBody = updateTemplateRequestBody.parse(bodyData);
    const result = await updateTemplate({ id: templateId, ...validatedBody });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};