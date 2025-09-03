import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { lockFunnel } from "../../../services/funnel-settings/lock-funnel";
import { UnauthorizedError } from "../../../errors/http-errors";

export const lockFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const funnelId = parseInt(req.params.funnelId);

    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    if (!funnelId || isNaN(funnelId)) {
      throw new Error("Invalid funnel ID");
    }

    const result = await lockFunnel(userId, {
      ...req.body,
      funnelId
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};