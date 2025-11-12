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
    const workspaceSlug = req.params.workspaceSlug;
    const funnelSlug = req.params.funnelSlug;

    // Validate authentication
    if (!userId) {
      throw new UnauthorizedError(
        "Authentication required to update funnel password"
      );
    }

    // Call service with slugs from params and newPassword from body
    const result = await updateFunnelPassword(userId, {
      workspaceSlug,
      funnelSlug,
      newPassword: req.body.newPassword,
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
