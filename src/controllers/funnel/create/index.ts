import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { createFunnel } from "../../../services/funnel/create";
import { UnauthorizedError } from "../../../errors/http-errors";

export const createFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Please log in to create a funnel");
    }

    const result = await createFunnel(userId, req.body);

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};