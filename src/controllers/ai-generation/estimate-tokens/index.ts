/**
 * Estimate Tokens Controller
 * Handles HTTP requests for token estimation operations
 */

import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { estimateGenerationTokens } from "../../../services/ai-generation/estimate-tokens";
import { UnauthorizedError } from "../../../errors";

/**
 * Estimate tokens for a generation request
 */
export const estimateTokensController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    // Service will validate the request body
    const result = await estimateGenerationTokens(userId, req.body);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
