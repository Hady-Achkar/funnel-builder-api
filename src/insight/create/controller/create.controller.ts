import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { createInsight } from "../service";
import { UnauthorizedError } from "../../../errors";

export const createInsightController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const result = await createInsight(userId, req.body);

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};