import { getPromptBalance } from "../../../utils/ai-generation/prompt-tracker";
import {
  GetPromptBalanceResponse,
  getPromptBalanceResponseSchema,
} from "../../../types/ai-generation/get-prompt-balance";
import { BadRequestError, UnauthorizedError } from "../../../errors";
import { ZodError } from "zod";

export async function getUserPromptBalance(
  userId: number
): Promise<GetPromptBalanceResponse> {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const balance = await getPromptBalance(userId);

    const response = {
      promptsUsed: balance.promptsUsed,
      promptsLimit: balance.promptsLimit,
      remainingPrompts: balance.remainingPrompts,
      lastResetAt: balance.lastResetAt,
      unlimited: balance.promptsLimit === null,
    };

    return getPromptBalanceResponseSchema.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data";
      throw new BadRequestError(message);
    }
    throw error;
  }
}
