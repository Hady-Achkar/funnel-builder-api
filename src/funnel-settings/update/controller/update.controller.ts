import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { updateFunnelSettings } from "../service";
import { UnauthorizedError } from "../../../errors/http-errors";

export const updateFunnelSettingsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const funnelId = parseInt(req.params.id);

    if (!userId) {
      throw new UnauthorizedError("Please log in to update funnel settings");
    }

    if (!funnelId || isNaN(funnelId)) {
      throw new Error("Invalid funnel ID");
    }

    const result = await updateFunnelSettings(userId, {
      ...req.body,
      funnelId
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};