import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getPage } from "../service";
import { UnauthorizedError } from "../../../errors";

export const getPageController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    // Get pageId from URL params
    const requestData = {
      pageId: req.params.id,
    };

    const result = await getPage(userId, requestData);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};