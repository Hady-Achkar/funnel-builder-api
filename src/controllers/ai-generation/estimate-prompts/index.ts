/**
 * Estimate Prompts Controller
 * Handles HTTP requests for prompt estimation operations
 */

import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { estimateGenerationPrompts } from "../../../services/ai-generation/estimate-prompts";
import { UnauthorizedError } from "../../../errors";

/**
 * Estimate prompts for a generation request
 */
export const estimatePromptsController = async (
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
    const result = await estimateGenerationPrompts(userId, req.body);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
