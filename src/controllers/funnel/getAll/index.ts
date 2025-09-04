import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getAllFunnels } from "../../../services/funnel/getAll";
import { UnauthorizedError } from "../../../errors/http-errors";

export const getAllFunnelsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to view funnels");
    }
    
    const workspaceSlug = req.params.workspaceSlug;
    const query = req.query;

    const result = await getAllFunnels(workspaceSlug, userId, query);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};