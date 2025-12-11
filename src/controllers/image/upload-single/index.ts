import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { UnauthorizedError } from "../../../errors/http-errors";
import { uploadSingleImage } from "../../../services/image/upload-single";
import { ZodError } from "zod";

interface UploadSingleRequest extends AuthRequest {
  file?: Express.Multer.File;
}

export const uploadSingleImageController = async (
  req: UploadSingleRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const file = req.file;
    if (!file) {
      throw new UnauthorizedError("No file provided");
    }

    const result = await uploadSingleImage(userId, file);

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstError = error.issues[0];
      return res.status(400).json({
        error: firstError?.message || "Invalid request data"
      });
    }
    next(error);
  }
};