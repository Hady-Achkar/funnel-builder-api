import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getUserImageFolders } from "../service";
import { UnauthorizedError } from "../../../errors";

export const getUserImageFoldersController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const result = await getUserImageFolders(userId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
