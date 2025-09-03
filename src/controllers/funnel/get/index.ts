import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getFunnel } from "../../../services/funnel/get";
import { UnauthorizedError } from "../../../errors/http-errors";

export const getFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to view the funnel");
    }
    
    const funnelId = parseInt(req.params.id);

    const result = await getFunnel(funnelId, userId);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};