/**
 * Get Generation History Controller
 * Handles HTTP requests for generation history operations
 */

import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getUserGenerationHistory } from "../../../services/ai-generation/get-generation-history";
import { UnauthorizedError } from "../../../errors";

/**
 * Get generation history with stats
 */
export const getGenerationHistoryController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    // Parse query parameters - service doesn't need validation for simple params
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

    const result = await getUserGenerationHistory(userId, limit, offset);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
