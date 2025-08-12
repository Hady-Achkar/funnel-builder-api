import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getImageFolderById } from "../service";
import { UnauthorizedError } from "../../../errors";

export const getImageFolderByIdController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const result = await getImageFolderById(userId, req.params);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
