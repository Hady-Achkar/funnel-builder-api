import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import { uploadImages } from "../../../services/image/upload";

interface UploadRequest extends AuthRequest {
  file?: Express.Multer.File;
  files?:
    | Express.Multer.File[]
    | { [fieldname: string]: Express.Multer.File[] };
}

export const uploadImagesController = async (
  req: UploadRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new BadRequestError("No files provided");
    }

    const result = await uploadImages(userId, req.params, files);

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};