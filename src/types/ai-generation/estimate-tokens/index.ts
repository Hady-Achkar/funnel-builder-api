import { z } from "zod";

export const estimateTokensRequestSchema = z.object({
  businessDescription: z.string().min(10).max(5000), // Increased to 5000 to support V2 refined prompts (300-800 words)
  industry: z.string().optional(),
  targetAudience: z.string().optional(),
  funnelType: z.string().optional(),
  maxPages: z.number().int().positive().optional().default(3),
});

export const estimateTokensResponseSchema = z.object({
  estimatedTokens: z.number().int().positive(),
  userBalance: z.object({
    tokensUsed: z.number().int().nonnegative(),
    tokensLimit: z.number().int().positive().nullable(),
    remainingTokens: z.number().int().nullable(), // Can be negative when user exceeds limit
  }),
  canGenerate: z.boolean(),
  message: z.string().optional(),
});

export type EstimateTokensRequest = z.infer<typeof estimateTokensRequestSchema>;
export type EstimateTokensResponse = z.infer<
  typeof estimateTokensResponseSchema
>;
