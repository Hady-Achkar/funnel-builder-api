import { getPrisma } from "../../../lib/prisma";
import { AITokenOperation } from "../../../generated/prisma-client";
import { BadRequestError } from "../../../errors";

export interface TokenBalance {
  userId: number;
  tokensUsed: number;
  tokensLimit: number | null;
  remainingTokens: number | null;
  lastResetAt: Date;
}

export interface TokenUsageResult {
  success: boolean;
  balanceBefore: number;
  balanceAfter: number;
  remainingTokens: number | null;
}

export interface TokenHistoryEntry {
  id: number;
  userId: number;
  tokensUsed: number;
  operation: AITokenOperation;
  description: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}

/**
 * Get or create user's token balance
 */
export async function getTokenBalance(userId: number): Promise<TokenBalance> {
  const prisma = getPrisma();

  let balance = await prisma.aITokenBalance.findUnique({
    where: { userId },
  });

  // Create balance record if it doesn't exist
  if (!balance) {
    balance = await prisma.aITokenBalance.create({
      data: {
        userId,
        tokensUsed: 0,
        tokensLimit: 0, // Start with 0 tokens - must be purchased/allocated
        lastResetAt: new Date(),
      },
    });
  }

  const remainingTokens =
    balance.tokensLimit !== null
      ? balance.tokensLimit - balance.tokensUsed
      : null;

  return {
    userId: balance.userId,
    tokensUsed: balance.tokensUsed,
    tokensLimit: balance.tokensLimit,
    remainingTokens,
    lastResetAt: balance.lastResetAt,
  };
}

/**
 * Check if user has enough tokens
 */
export async function hasEnoughTokens(
  userId: number,
  tokensNeeded: number
): Promise<boolean> {
  const balance = await getTokenBalance(userId);

  // If no limit, always have enough
  if (balance.tokensLimit === null) {
    return true;
  }

  // Check if enough tokens remain
  return balance.tokensUsed + tokensNeeded <= balance.tokensLimit;
}

/**
 * Deduct tokens from user's balance
 */
export async function deductTokens(
  userId: number,
  tokensUsed: number,
  generationLogId?: number,
  description?: string
): Promise<TokenUsageResult> {
  const prisma = getPrisma();

  // Check if user has enough tokens
  const hasTokens = await hasEnoughTokens(userId, tokensUsed);
  if (!hasTokens) {
    const balance = await getTokenBalance(userId);
    throw new BadRequestError(
      `Insufficient AI tokens. You have ${balance.remainingTokens} tokens remaining, but need ${tokensUsed} tokens for this operation.`
    );
  }

  // Get current balance
  const currentBalance = await getTokenBalance(userId);
  const balanceBefore = currentBalance.tokensUsed;
  const balanceAfter = balanceBefore + tokensUsed;

  // Update balance and create history entry in transaction
  await prisma.$transaction(async (tx) => {
    // Update balance
    await tx.aITokenBalance.update({
      where: { userId },
      data: {
        tokensUsed: balanceAfter,
      },
    });

    // Create history entry
    await tx.aITokenHistory.create({
      data: {
        userId,
        tokensUsed,
        operation: AITokenOperation.DEDUCTION,
        generationLogId,
        description: description || "AI generation token usage",
        balanceBefore,
        balanceAfter,
      },
    });
  });

  const remainingTokens =
    currentBalance.tokensLimit !== null
      ? currentBalance.tokensLimit - balanceAfter
      : null;

  return {
    success: true,
    balanceBefore,
    balanceAfter,
    remainingTokens,
  };
}

/**
 * Add tokens to user's balance (for refunds, adjustments, etc.)
 */
export async function addTokens(
  userId: number,
  tokensToAdd: number,
  operation: AITokenOperation,
  description?: string
): Promise<TokenUsageResult> {
  const prisma = getPrisma();

  const currentBalance = await getTokenBalance(userId);
  const balanceBefore = currentBalance.tokensUsed;
  const balanceAfter = Math.max(0, balanceBefore - tokensToAdd); // Can't go below 0

  await prisma.$transaction(async (tx) => {
    await tx.aITokenBalance.update({
      where: { userId },
      data: {
        tokensUsed: balanceAfter,
      },
    });

    await tx.aITokenHistory.create({
      data: {
        userId,
        tokensUsed: tokensToAdd,
        operation,
        description: description || `Token ${operation.toLowerCase()}`,
        balanceBefore,
        balanceAfter,
      },
    });
  });

  const remainingTokens =
    currentBalance.tokensLimit !== null
      ? currentBalance.tokensLimit - balanceAfter
      : null;

  return {
    success: true,
    balanceBefore,
    balanceAfter,
    remainingTokens,
  };
}

/**
 * Reset user's token balance
 */
export async function resetTokenBalance(
  userId: number,
  description?: string
): Promise<TokenUsageResult> {
  const prisma = getPrisma();

  const currentBalance = await getTokenBalance(userId);
  const balanceBefore = currentBalance.tokensUsed;
  const balanceAfter = 0;

  await prisma.$transaction(async (tx) => {
    await tx.aITokenBalance.update({
      where: { userId },
      data: {
        tokensUsed: 0,
        lastResetAt: new Date(),
      },
    });

    await tx.aITokenHistory.create({
      data: {
        userId,
        tokensUsed: balanceBefore,
        operation: AITokenOperation.RESET,
        description: description || "Token balance reset",
        balanceBefore,
        balanceAfter,
      },
    });
  });

  return {
    success: true,
    balanceBefore,
    balanceAfter,
    remainingTokens: currentBalance.tokensLimit,
  };
}

/**
 * Update user's token limit
 */
export async function updateTokenLimit(
  userId: number,
  newLimit: number | null,
  description?: string
): Promise<void> {
  const prisma = getPrisma();

  const currentBalance = await getTokenBalance(userId);

  await prisma.$transaction(async (tx) => {
    await tx.aITokenBalance.update({
      where: { userId },
      data: {
        tokensLimit: newLimit,
      },
    });

    await tx.aITokenHistory.create({
      data: {
        userId,
        tokensUsed: 0,
        operation: AITokenOperation.ADJUSTMENT,
        description:
          description ||
          `Token limit updated to ${
            newLimit === null ? "unlimited" : newLimit
          }`,
        balanceBefore: currentBalance.tokensUsed,
        balanceAfter: currentBalance.tokensUsed,
      },
    });
  });
}

/**
 * Get user's token usage history
 */
export async function getTokenHistory(
  userId: number,
  limit: number = 50,
  offset: number = 0
): Promise<TokenHistoryEntry[]> {
  const prisma = getPrisma();

  const history = await prisma.aITokenHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
  });

  return history;
}

/**
 * Get total tokens used by user
 */
export async function getTotalTokensUsed(userId: number): Promise<number> {
  const balance = await getTokenBalance(userId);
  return balance.tokensUsed;
}

/**
 * Estimate tokens for a generation request
 * This is a rough estimate based on prompt length and expected response
 */
export function estimateTokensForGeneration(
  promptLength: number,
  numberOfPages: number = 1
): number {
  // Rough estimate:
  // - System prompt: ~5000 tokens
  // - User prompt: promptLength / 4 (rough char to token ratio)
  // - Expected response: ~1000 tokens per page
  // - Add 20% buffer

  const systemPromptTokens = 5000;
  const userPromptTokens = Math.ceil(promptLength / 4);
  const expectedResponseTokens = numberOfPages * 1000;
  const buffer = 1.2;

  return Math.ceil(
    (systemPromptTokens + userPromptTokens + expectedResponseTokens) * buffer
  );
}

/**
 * Log a generation event (separate from token deduction)
 */
export async function logGeneration(
  userId: number,
  workspaceId: number,
  funnelId: number | null,
  prompt: string,
  tokensUsed: number,
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
      tokensUsed,
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

  const [totalGenerations, totalPages, totalTokens, recentGenerations] =
    await Promise.all([
      prisma.aIGenerationLog.count({ where: { userId } }),
      prisma.aIGenerationLog.aggregate({
        where: { userId },
        _sum: { pagesGenerated: true },
      }),
      prisma.aIGenerationLog.aggregate({
        where: { userId },
        _sum: { tokensUsed: true },
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
    totalTokensUsed: totalTokens._sum.tokensUsed || 0,
    generationsLast30Days: recentGenerations,
  };
}
