import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { unlockFunnel } from "../../../services/funnel-settings/unlock-funnel";
import { UnauthorizedError } from "../../../errors/http-errors";

export const unlockFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const workspaceSlug = req.params.workspaceSlug;
    const funnelSlug = req.params.funnelSlug;

    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const result = await unlockFunnel(userId, {
      workspaceSlug,
      funnelSlug
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};