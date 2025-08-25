import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { deletePage } from "../service";
import { UnauthorizedError } from "../../../errors";

export const deletePageController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const pageId = Number(req.params.id);

    const result = await deletePage(userId, { pageId });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
