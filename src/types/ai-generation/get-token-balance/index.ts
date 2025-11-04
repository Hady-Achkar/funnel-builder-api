import { z } from "zod";

export const getTokenBalanceResponseSchema = z.object({
  tokensUsed: z.number().int().nonnegative(),
  tokensLimit: z.number().int().positive().nullable(),
  remainingTokens: z.number().int().nullable(),
  lastResetAt: z.date(),
  unlimited: z.boolean(),
});

export type GetTokenBalanceResponse = z.infer<
  typeof getTokenBalanceResponseSchema
>;
