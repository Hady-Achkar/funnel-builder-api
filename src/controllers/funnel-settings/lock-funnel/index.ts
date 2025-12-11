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
    const workspaceSlug = req.params.workspaceSlug;
    const funnelSlug = req.params.funnelSlug;

    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const result = await lockFunnel(userId, {
      ...req.body,
      workspaceSlug,
      funnelSlug
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};