import { z } from "zod";

/**
 * Modify Funnel Request Schema
 * Allows AI to modify existing funnel pages with optional new page generation
 */
export const modifyFunnelRequestSchema = z.object({
  funnelId: z.number().int().positive({
    message: "Funnel ID must be a positive integer",
  }),

  pageIds: z
    .array(
      z.number().int().positive({
        message: "Page ID must be a positive integer",
      })
    )
    .optional()
    .describe(
      "Optional array of page IDs to modify. If not provided, all pages in the funnel will be considered for modification."
    ),

  userPrompt: z
    .string()
    .min(10, {
      message: "User prompt must be at least 10 characters",
    })
    .max(5000, {
      message: "User prompt must not exceed 5000 characters",
    })
    .describe(
      "Instructions for how to modify the funnel pages (e.g., 'Add more testimonials', 'Make it darker', 'Add a pricing section')"
    ),

  allowGenerateNewPages: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "If true, AI can generate new pages in addition to modifying existing ones. If false, AI can only modify selected pages."
    ),

  maxNewPages: z
    .number()
    .int()
    .positive()
    .max(10)
    .optional()
    .default(3)
    .describe(
      "Maximum number of new pages AI can generate (only applies if allowGenerateNewPages is true)"
    ),

  maxElementsPerPage: z
    .number()
    .int()
    .positive()
    .max(20)
    .optional()
    .default(8)
    .describe("Maximum elements per page for modified/new pages"),
});

/**
 * Modify Funnel Response Schema
 * Returns modified funnel with token usage and generation metadata
 */
export const modifyFunnelResponseSchema = z.object({
  message: z.string(),

  funnel: z.object({
    id: z.number().int().positive(),
    name: z.string(),
    pages: z.array(
      z.object({
        id: z.number().int().positive(),
        name: z.string(),
        type: z.enum(["PAGE", "RESULT"]),
        order: z.number().int().nonnegative(),
        isNew: z
          .boolean()
          .optional()
          .describe("True if this page was newly generated"),
        wasModified: z
          .boolean()
          .optional()
          .describe("True if this page was modified"),
      })
    ),
  }),

  tokensUsed: z.number().int().nonnegative(),
  remainingTokens: z.number().int().nullable(),
  generationLogId: z.number().int().positive(),

  modificationSummary: z.object({
    pagesModified: z.number().int().nonnegative(),
    pagesCreated: z.number().int().nonnegative(),
    totalElementsModified: z.number().int().nonnegative(),
    totalElementsCreated: z.number().int().nonnegative(),
  }),
});

export type ModifyFunnelRequest = z.infer<typeof modifyFunnelRequestSchema>;
export type ModifyFunnelResponse = z.infer<typeof modifyFunnelResponseSchema>;
