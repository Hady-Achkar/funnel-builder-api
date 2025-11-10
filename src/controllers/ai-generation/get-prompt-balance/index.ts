/**
 * Get Prompt Balance Controller
 * Handles HTTP requests for prompt balance operations
 */

import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { getUserPromptBalance } from "../../../services/ai-generation/get-prompt-balance";
import { UnauthorizedError } from "../../../errors";

/**
 * Get current prompt balance
 */
export const getPromptBalanceController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    const result = await getUserPromptBalance(userId);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
