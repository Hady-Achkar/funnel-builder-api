import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { UnauthorizedError } from "../../../errors/http-errors";
import { updateFunnelSettings } from "../../../services/funnel-settings/update";

export const updateFunnelSettingsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const workspaceSlug = req.params.workspaceSlug;
    const funnelSlug = req.params.funnelSlug;

    if (!userId) {
      throw new UnauthorizedError("Please log in to update funnel settings");
    }

    const result = await updateFunnelSettings(userId, {
      ...req.body,
      workspaceSlug,
      funnelSlug,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
