import { z } from "zod";

export const duplicatePageRequest = z.object({
  pageId: z.number().positive("Page ID must be a positive number"),
  targetFunnelId: z.number().positive("Target funnel ID must be a positive number").optional(),
});

export const duplicatePageResponse = z.object({
  message: z.string(),
  pageId: z.number(),
});

export type DuplicatePageRequest = z.infer<typeof duplicatePageRequest>;
export type DuplicatePageResponse = z.infer<typeof duplicatePageResponse>;