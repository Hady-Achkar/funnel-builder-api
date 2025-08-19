import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import { updateImage } from "../service/update.service";

interface UpdateRequest extends AuthRequest {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

export const updateImageController = async (
  req: UpdateRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    let file: Express.Multer.File | undefined;
    if (req.files && typeof req.files === 'object' && !Array.isArray(req.files)) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      file = files.image?.[0];
    }

    const formData = {
      name: req.body.name,
      altText: req.body.altText,
    };

    if (!file && !formData.name && !formData.altText) {
      throw new BadRequestError("At least one field (image, name, or altText) must be provided");
    }

    const result = await updateImage(userId, req.params, formData, file);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};