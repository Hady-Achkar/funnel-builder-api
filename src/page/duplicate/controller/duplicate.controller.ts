import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { duplicatePage } from "../service";
import { UnauthorizedError } from "../../../errors";

export const duplicatePageController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const pageId = Number(req.params.pageId);
    const targetFunnelId = req.body.targetFunnelId
      ? Number(req.body.targetFunnelId)
      : undefined;

    const result = await duplicatePage(userId, {
      pageId,
      targetFunnelId,
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};