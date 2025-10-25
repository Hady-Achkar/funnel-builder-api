import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { updateFunnelPassword } from "../../../services/funnel-settings/update-password";
import {
  UnauthorizedError,
  BadRequestError,
} from "../../../errors/http-errors";

export const updatePasswordController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    const funnelId = parseInt(req.params.funnelId);

    // Validate authentication
    if (!userId) {
      throw new UnauthorizedError(
        "Authentication required to update funnel password"
      );
    }

    // Validate funnelId parameter
    if (!funnelId || isNaN(funnelId)) {
      throw new BadRequestError("Invalid funnel ID provided");
    }

    // Call service with funnelId from params and newPassword from body
    const result = await updateFunnelPassword(userId, {
      funnelId,
      newPassword: req.body.newPassword,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
