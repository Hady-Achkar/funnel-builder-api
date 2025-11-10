import { z } from "zod";

export const getPromptBalanceResponseSchema = z.object({
  promptsUsed: z.number().int().nonnegative(),
  promptsLimit: z.number().int().positive().nullable(),
  remainingPrompts: z.number().int().nullable(),
  lastResetAt: z.date(),
  unlimited: z.boolean(),
});

export type GetPromptBalanceResponse = z.infer<
  typeof getPromptBalanceResponseSchema
>;
