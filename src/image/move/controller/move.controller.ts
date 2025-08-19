import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { UnauthorizedError, BadRequestError } from "../../../errors";
import { moveImage } from "../service/move.service";

export const moveImageController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    if (!req.body) {
      throw new BadRequestError("Request body is required");
    }

    const result = await moveImage(userId, req.params, req.body);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};