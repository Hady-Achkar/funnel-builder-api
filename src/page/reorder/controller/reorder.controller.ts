import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { reorderPages } from "../service";
import { UnauthorizedError } from "../../../errors";

export const reorderPagesController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const funnelId = Number(req.params.funnelId);
    const pageOrders = req.body.pageOrders;

    const result = await reorderPages(userId, {
      funnelId,
      pageOrders,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};