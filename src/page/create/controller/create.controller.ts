import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { createPage } from "../service";
import { UnauthorizedError } from "../../../errors";

export const createPageController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const requestData = {
      body: req.body,
      funnelId: req.params.funnelId,
    };

    const result = await createPage(userId, requestData);

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
