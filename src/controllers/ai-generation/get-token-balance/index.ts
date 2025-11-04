/**
 * Get Token Balance Controller
 * Handles HTTP requests for token balance operations
 */

import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getUserTokenBalance } from "../../../services/ai-generation/get-token-balance";
import { UnauthorizedError } from "../../../errors";

/**
 * Get current token balance
 */
export const getTokenBalanceController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const result = await getUserTokenBalance(userId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
