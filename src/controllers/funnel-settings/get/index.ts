import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getFunnelSettings } from "../../../services/funnel-settings/get";
import { UnauthorizedError } from "../../../errors/http-errors";

export const getFunnelSettingsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to view funnel settings");
    }

    const workspaceSlug = req.params.workspaceSlug;
    const funnelSlug = req.params.funnelSlug;

    const result = await getFunnelSettings(workspaceSlug, funnelSlug, userId);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
