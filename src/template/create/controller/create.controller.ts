import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { createTemplate } from "../service";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import multer from "multer";

// Multer configuration - stores files in memory for processing
// All validation (size, type, extension) is handled in image.helpers.ts
export const upload = multer({
  storage: multer.memoryStorage(),
});

export const createTemplateController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    const thumbnail = files?.thumbnail?.[0];
    const previews = files?.previews || [];

    if (!thumbnail) {
      throw new BadRequestError("Thumbnail image is required");
    }

    const templateData = {
      name: req.body.name,
      description: req.body.description,
      categoryId: parseInt(req.body.categoryId),
      funnelId: parseInt(req.body.funnelId),
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      isPublic: req.body.isPublic === "true",
    };

    const result = await createTemplate(
      userId,
      templateData,
      thumbnail,
      previews
    );

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
