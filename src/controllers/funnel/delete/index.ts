import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { deleteFunnel } from "../../../services/funnel/delete";
import { UnauthorizedError } from "../../../errors/http-errors";

export const deleteFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to delete the funnel");
    }
    
    const funnelId = parseInt(req.params.id);

    const result = await deleteFunnel(funnelId, userId);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};