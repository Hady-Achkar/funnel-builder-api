import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { duplicateFunnel } from "../service";
import { UnauthorizedError } from "../../../errors/http-errors";

export const duplicateFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to duplicate the funnel");
    }

    const funnelId = parseInt(req.params.id);
    const data = req.body;

    const result = await duplicateFunnel(funnelId, userId, data);

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};