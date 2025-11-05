import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middleware/auth";
import { modifyFunnel } from "../../../services/ai-generation/modify-funnel";
import { isGeminiConfigured } from "../../../utils/ai-generation/gemini-client";
import { UnauthorizedError, BadRequestError } from "../../../errors";

export const modifyFunnelController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new UnauthorizedError("Authentication required");
    }

    // Check if Gemini API is configured
    if (!isGeminiConfigured()) {
      throw new BadRequestError(
        "AI generation is not configured. Please contact support."
      );
    }

    const result = await modifyFunnel(userId, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
