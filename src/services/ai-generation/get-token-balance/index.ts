import { getTokenBalance } from "../../../utils/ai-generation/token-tracker";
import {
  GetTokenBalanceResponse,
  getTokenBalanceResponseSchema,
} from "../../../types/ai-generation/get-token-balance";
import { BadRequestError, UnauthorizedError } from "../../../errors";
import { ZodError } from "zod";

export async function getUserTokenBalance(
  userId: number
): Promise<GetTokenBalanceResponse> {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const balance = await getTokenBalance(userId);

    const response = {
      tokensUsed: balance.tokensUsed,
      tokensLimit: balance.tokensLimit,
      remainingTokens: balance.remainingTokens,
      lastResetAt: balance.lastResetAt,
      unlimited: balance.tokensLimit === null,
    };

    return getTokenBalanceResponseSchema.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data";
      throw new BadRequestError(message);
    }
    throw error;
  }
}
