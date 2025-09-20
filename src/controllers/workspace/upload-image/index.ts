import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import { uploadWorkspaceImage } from "../../../services/workspace/upload-image";
import { UploadWorkspaceImageRequest } from "../../../types/workspace/upload-image";

interface UploadRequest extends AuthRequest {
  file?: Express.Multer.File;
}

export const uploadWorkspaceImageController = async (
  req: UploadRequest,
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
      throw new BadRequestError("No file provided");
    }

    const params = req.params as UploadWorkspaceImageRequest;
    const result = await uploadWorkspaceImage(userId, params, file);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
