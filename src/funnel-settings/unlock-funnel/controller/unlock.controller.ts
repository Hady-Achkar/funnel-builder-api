import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { unlockFunnel } from "../service";
import { UnauthorizedError } from "../../../errors";

export const unlockFunnelController = async (
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

    const result = await unlockFunnel(userId, {
      funnelId
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};