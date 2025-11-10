import { z } from "zod";

export const getGenerationHistoryRequestSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});

export const getGenerationHistoryResponseSchema = z.object({
  history: z.array(
    z.object({
      id: z.number().int().positive(),
      prompt: z.string(),
      promptsUsed: z.number().int().nonnegative(),
      pagesGenerated: z.number().int().nonnegative(),
      model: z.string(),
      createdAt: z.date(),
      workspace: z.object({
        id: z.number().int().positive(),
        name: z.string(),
      }),
      funnel: z
        .object({
          id: z.number().int().positive(),
          name: z.string(),
        })
        .nullable(),
    })
  ),
  stats: z.object({
    totalGenerations: z.number().int().nonnegative(),
    totalPagesGenerated: z.number().int().nonnegative(),
    totalPromptsUsed: z.number().int().nonnegative(),
    generationsLast30Days: z.number().int().nonnegative(),
  }),
});

export type GetGenerationHistoryRequest = z.infer<
  typeof getGenerationHistoryRequestSchema
>;
export type GetGenerationHistoryResponse = z.infer<
  typeof getGenerationHistoryResponseSchema
>;
