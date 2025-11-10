import { z } from "zod";

export const estimatePromptsRequestSchema = z.object({
  businessDescription: z.string().min(10).max(5000), // Increased to 5000 to support V2 refined prompts (300-800 words)
  industry: z.string().optional(),
  targetAudience: z.string().optional(),
  funnelType: z.string().optional(),
  maxPages: z.number().int().positive().optional().default(3),
});

export const estimatePromptsResponseSchema = z.object({
  promptsNeeded: z.number().int().positive(),
  userBalance: z.object({
    promptsUsed: z.number().int().nonnegative(),
    promptsLimit: z.number().int().positive().nullable(),
    remainingPrompts: z.number().int().nullable(), // Can be negative when user exceeds limit
  }),
  canGenerate: z.boolean(),
  message: z.string().optional(),
});

export type EstimatePromptsRequest = z.infer<typeof estimatePromptsRequestSchema>;
export type EstimatePromptsResponse = z.infer<
  typeof estimatePromptsResponseSchema
>;
