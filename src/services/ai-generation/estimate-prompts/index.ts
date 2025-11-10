import { getPromptBalance } from "../../../utils/ai-generation/prompt-tracker";
import {
  EstimatePromptsResponse,
  estimatePromptsRequestSchema,
  estimatePromptsResponseSchema,
} from "../../../types/ai-generation/estimate-prompts";
import { BadRequestError, UnauthorizedError } from "../../../errors";
import { ZodError } from "zod";

/**
 * Estimate prompts for a generation request
 * In the simple 1:1 model, every generation requires exactly 1 prompt
 */
export async function estimateGenerationPrompts(
  userId: number,
  requestBody: Record<string, unknown>
): Promise<EstimatePromptsResponse> {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    // Validate request (still useful for input validation)
    const request = estimatePromptsRequestSchema.parse(requestBody);

    // Simple 1:1 model: Every generation = 1 prompt
    const promptsNeeded = 1;

    // Get user balance
    const balance = await getPromptBalance(userId);

    // Check if user can generate
    const canGenerate =
      balance.promptsLimit === null ||
      balance.promptsUsed + promptsNeeded <= balance.promptsLimit;

    let message: string | undefined;
    if (!canGenerate && balance.remainingPrompts !== null) {
      message = `Insufficient prompts. You need ${promptsNeeded} prompt but only have ${balance.remainingPrompts} remaining.`;
    } else if (canGenerate) {
      message = `This generation will use ${promptsNeeded} prompt. You have ${balance.remainingPrompts || "unlimited"} prompts ${balance.remainingPrompts ? "remaining" : "available"}.`;
    }

    const response = {
      promptsNeeded,
      userBalance: {
        promptsUsed: balance.promptsUsed,
        promptsLimit: balance.promptsLimit,
        remainingPrompts: balance.remainingPrompts,
      },
      canGenerate,
      message,
    };

    return estimatePromptsResponseSchema.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
}
