import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { createImageFolder } from "../../../services/image-folder/create";
import { UnauthorizedError } from "../../../errors";

export const createImageFolderController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const result = await createImageFolder(userId, req.body);

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};