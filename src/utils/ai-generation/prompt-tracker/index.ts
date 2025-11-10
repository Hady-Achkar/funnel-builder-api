import { getPrisma } from "../../../lib/prisma";
import { AIPromptOperation } from "../../../generated/prisma-client";
import { BadRequestError } from "../../../errors";

export interface PromptBalance {
  userId: number;
  promptsUsed: number;
  promptsLimit: number | null;
  remainingPrompts: number | null;
  lastResetAt: Date;
}

export interface PromptUsageResult {
  success: boolean;
  balanceBefore: number;
  balanceAfter: number;
  remainingPrompts: number | null;
}

export interface PromptHistoryEntry {
  id: number;
  userId: number;
  promptsUsed: number;
  operation: AIPromptOperation;
  description: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}

/**
 * Get or create user's prompt balance
 */
export async function getPromptBalance(userId: number): Promise<PromptBalance> {
  const prisma = getPrisma();

  let balance = await prisma.aIPromptBalance.findUnique({
    where: { userId },
  });

  // Create balance record if it doesn't exist
  if (!balance) {
    balance = await prisma.aIPromptBalance.create({
      data: {
        userId,
        promptsUsed: 0,
        promptsLimit: 0, // Start with 0 prompts - must be purchased/allocated
        lastResetAt: new Date(),
      },
    });
  }

  const remainingPrompts =
    balance.promptsLimit !== null
      ? balance.promptsLimit - balance.promptsUsed
      : null;

  return {
    userId: balance.userId,
    promptsUsed: balance.promptsUsed,
    promptsLimit: balance.promptsLimit,
    remainingPrompts,
    lastResetAt: balance.lastResetAt,
  };
}

/**
 * Check if user has enough prompts
 */
export async function hasEnoughPrompts(
  userId: number,
  promptsNeeded: number
): Promise<boolean> {
  const balance = await getPromptBalance(userId);

  // If no limit, always have enough
  if (balance.promptsLimit === null) {
    return true;
  }

  // Check if enough prompts remain
  return balance.promptsUsed + promptsNeeded <= balance.promptsLimit;
}

/**
 * Deduct prompts from user's balance
 * For the simple 1:1 model, promptsUsed will always be 1
 */
export async function deductPrompts(
  userId: number,
  promptsUsed: number,
  generationLogId?: number,
  description?: string
): Promise<PromptUsageResult> {
  const prisma = getPrisma();

  // Check if user has enough prompts
  const hasPrompts = await hasEnoughPrompts(userId, promptsUsed);
  if (!hasPrompts) {
    const balance = await getPromptBalance(userId);
    throw new BadRequestError(
      `Insufficient AI prompts. You have ${balance.remainingPrompts} prompts remaining, but need ${promptsUsed} prompts for this operation.`
    );
  }

  // Get current balance
  const currentBalance = await getPromptBalance(userId);
  const balanceBefore = currentBalance.promptsUsed;
  const balanceAfter = balanceBefore + promptsUsed;

  // Update balance and create history entry in transaction
  await prisma.$transaction(async (tx) => {
    // Update balance
    await tx.aIPromptBalance.update({
      where: { userId },
      data: {
        promptsUsed: balanceAfter,
      },
    });

    // Create history entry
    await tx.aIPromptHistory.create({
      data: {
        userId,
        promptsUsed,
        operation: AIPromptOperation.DEDUCTION,
        generationLogId,
        description: description || "AI generation prompt usage",
        balanceBefore,
        balanceAfter,
      },
    });
  });

  const remainingPrompts =
    currentBalance.promptsLimit !== null
      ? currentBalance.promptsLimit - balanceAfter
      : null;

  return {
    success: true,
    balanceBefore,
    balanceAfter,
    remainingPrompts,
  };
}

/**
 * Add prompts to user's balance (for refunds, adjustments, purchases, etc.)
 */
export async function addPrompts(
  userId: number,
  promptsToAdd: number,
  operation: AIPromptOperation,
  description?: string
): Promise<PromptUsageResult> {
  const prisma = getPrisma();

  const currentBalance = await getPromptBalance(userId);
  const balanceBefore = currentBalance.promptsUsed;
  const balanceAfter = Math.max(0, balanceBefore - promptsToAdd); // Can't go below 0

  await prisma.$transaction(async (tx) => {
    await tx.aIPromptBalance.update({
      where: { userId },
      data: {
        promptsUsed: balanceAfter,
      },
    });

    await tx.aIPromptHistory.create({
      data: {
        userId,
        promptsUsed: promptsToAdd,
        operation,
        description: description || `Prompt ${operation.toLowerCase()}`,
        balanceBefore,
        balanceAfter,
      },
    });
  });

  const remainingPrompts =
    currentBalance.promptsLimit !== null
      ? currentBalance.promptsLimit - balanceAfter
      : null;

  return {
    success: true,
    balanceBefore,
    balanceAfter,
    remainingPrompts,
  };
}

/**
 * Reset user's prompt balance
 */
export async function resetPromptBalance(
  userId: number,
  description?: string
): Promise<PromptUsageResult> {
  const prisma = getPrisma();

  const currentBalance = await getPromptBalance(userId);
  const balanceBefore = currentBalance.promptsUsed;
  const balanceAfter = 0;

  await prisma.$transaction(async (tx) => {
    await tx.aIPromptBalance.update({
      where: { userId },
      data: {
        promptsUsed: 0,
        lastResetAt: new Date(),
      },
    });

    await tx.aIPromptHistory.create({
      data: {
        userId,
        promptsUsed: balanceBefore,
        operation: AIPromptOperation.RESET,
        description: description || "Prompt balance reset",
        balanceBefore,
        balanceAfter,
      },
    });
  });

  return {
    success: true,
    balanceBefore,
    balanceAfter,
    remainingPrompts: currentBalance.promptsLimit,
  };
}

/**
 * Update user's prompt limit
 */
export async function updatePromptLimit(
  userId: number,
  newLimit: number | null,
  description?: string
): Promise<void> {
  const prisma = getPrisma();

  const currentBalance = await getPromptBalance(userId);

  await prisma.$transaction(async (tx) => {
    await tx.aIPromptBalance.update({
      where: { userId },
      data: {
        promptsLimit: newLimit,
      },
    });

    await tx.aIPromptHistory.create({
      data: {
        userId,
        promptsUsed: 0,
        operation: AIPromptOperation.ADJUSTMENT,
        description:
          description ||
          `Prompt limit updated to ${
            newLimit === null ? "unlimited" : newLimit
          }`,
        balanceBefore: currentBalance.promptsUsed,
        balanceAfter: currentBalance.promptsUsed,
      },
    });
  });
}

/**
 * Get user's prompt usage history
 */
export async function getPromptHistory(
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<PromptHistoryEntry[]> {
  const prisma = getPrisma();

  const history = await prisma.aIPromptHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return history;
}

/**
 * Get total prompts used by user
 */
export async function getTotalPromptsUsed(userId: number): Promise<number> {
  const balance = await getPromptBalance(userId);
  return balance.promptsUsed;
}

/**
 * Log a generation event
 * @param actualTokensUsed - Actual API token usage for analytics (not user-facing)
 * @param promptsUsed - User-facing prompt count (typically 1 for simple 1:1 model)
 */
export async function logGeneration(
  userId: number,
  workspaceId: number,
  funnelId: number | null,
  prompt: string,
  actualTokensUsed: number,
  promptsUsed: number,
  pagesGenerated: number,
  model: string = "gemini-2.5-pro"
): Promise<number> {
  const prisma = getPrisma();

  const log = await prisma.aIGenerationLog.create({
    data: {
      userId,
      workspaceId,
      funnelId,
      prompt,
      actualTokensUsed,
      promptsUsed,
      pagesGenerated,
      model,
    },
  });

  return log.id;
}

/**
 * Get generation logs for a user
 */
export async function getGenerationLogs(
  userId: number,
  limit: number = 20,
  offset: number = 0
) {
  const prisma = getPrisma();

  return await prisma.aIGenerationLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
      funnel: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Get generation stats for a user
 */
export async function getGenerationStats(userId: number) {
  const prisma = getPrisma();

  const [totalGenerations, totalPages, totalPrompts, totalActualTokens, recentGenerations] =
    await Promise.all([
      prisma.aIGenerationLog.count({ where: { userId } }),
      prisma.aIGenerationLog.aggregate({
        where: { userId },
        _sum: { pagesGenerated: true },
      }),
      prisma.aIGenerationLog.aggregate({
        where: { userId },
        _sum: { promptsUsed: true },
      }),
      prisma.aIGenerationLog.aggregate({
        where: { userId },
        _sum: { actualTokensUsed: true },
      }),
      prisma.aIGenerationLog.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

  return {
    totalGenerations,
    totalPagesGenerated: totalPages._sum.pagesGenerated || 0,
    totalPromptsUsed: totalPrompts._sum.promptsUsed || 0,
    totalActualTokensUsed: totalActualTokens._sum.actualTokensUsed || 0, // For internal analytics
    generationsLast30Days: recentGenerations,
  };
}
