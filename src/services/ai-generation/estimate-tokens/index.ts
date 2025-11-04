import {
  getTokenBalance,
  estimateTokensForGeneration,
} from "../../../utils/ai-generation/token-tracker";
import {
  buildUserPrompt,
  buildSystemPrompt,
} from "../../../utils/ai-generation/prompt-builder";
import {
  EstimateTokensResponse,
  estimateTokensRequestSchema,
  estimateTokensResponseSchema,
} from "../../../types/ai-generation/estimate-tokens";
import { BadRequestError, UnauthorizedError } from "../../../errors";
import { ZodError } from "zod";

/**
 * Estimate tokens for a generation request
 */
export async function estimateGenerationTokens(
  userId: number,
  requestBody: Record<string, unknown>
): Promise<EstimateTokensResponse> {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    // Validate request
    const request = estimateTokensRequestSchema.parse(requestBody);

    // Build prompts to estimate size
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(
      request.businessDescription,
      request.industry,
      request.targetAudience,
      request.funnelType
    );

    // Estimate tokens
    const estimatedTokens = estimateTokensForGeneration(
      systemPrompt.length + userPrompt.length,
      request.maxPages || 3
    );

    // Get user balance
    const balance = await getTokenBalance(userId);

    // Check if user can generate
    const canGenerate =
      balance.tokensLimit === null ||
      balance.tokensUsed + estimatedTokens <= balance.tokensLimit;

    let message: string | undefined;
    if (!canGenerate && balance.remainingTokens !== null) {
      message = `Insufficient tokens. You need ${estimatedTokens} tokens but only have ${balance.remainingTokens} remaining.`;
    }

    const response = {
      estimatedTokens,
      userBalance: {
        tokensUsed: balance.tokensUsed,
        tokensLimit: balance.tokensLimit,
        remainingTokens: balance.remainingTokens,
      },
      canGenerate,
      message,
    };

    return estimateTokensResponseSchema.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
}
