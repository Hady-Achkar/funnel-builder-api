import {
  getGenerationLogs,
  getGenerationStats,
} from "../../../utils/ai-generation/prompt-tracker";
import {
  GetGenerationHistoryResponse,
  getGenerationHistoryResponseSchema,
} from "../../../types/ai-generation/get-generation-history";
import { BadRequestError, UnauthorizedError } from "../../../errors";
import { ZodError } from "zod";

/**
 * Get user's generation history with stats
 */
export async function getUserGenerationHistory(
  userId: number,
  limit: number = 20,
  offset: number = 0
): Promise<GetGenerationHistoryResponse> {
  try {
    if (!userId) throw new UnauthorizedError("User ID is required");

    const [logs, stats] = await Promise.all([
      getGenerationLogs(userId, limit, offset),
      getGenerationStats(userId),
    ]);

    const response = {
      history: logs.map((log) => ({
        id: log.id,
        prompt: log.prompt,
        promptsUsed: log.promptsUsed,
        pagesGenerated: log.pagesGenerated,
        model: log.model,
        createdAt: log.createdAt,
        workspace: log.workspace,
        funnel: log.funnel,
      })),
      stats: {
        totalGenerations: stats.totalGenerations,
        totalPagesGenerated: stats.totalPagesGenerated,
        totalPromptsUsed: stats.totalPromptsUsed,
        generationsLast30Days: stats.generationsLast30Days,
      },
    };

    return getGenerationHistoryResponseSchema.parse(response);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data";
      throw new BadRequestError(message);
    }
    throw error;
  }
}
