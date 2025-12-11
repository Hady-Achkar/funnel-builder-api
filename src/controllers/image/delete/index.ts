import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { UnauthorizedError } from "../../../errors";
import { deleteImage } from "../../../services/image/delete";

export const deleteImageController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const result = await deleteImage(userId, req.params);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};