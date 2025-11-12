import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { updateFunnel } from "../../../services/funnel/update";
import { UnauthorizedError } from "../../../errors/http-errors";

export const updateFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to update a funnel");
    }
    const workspaceSlug = req.params.workspaceSlug;
    const funnelSlug = req.params.funnelSlug;

    const result = await updateFunnel(userId, {
      workspaceSlug,
      funnelSlug,
    }, req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};