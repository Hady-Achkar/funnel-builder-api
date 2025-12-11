import { z } from "zod";

// Page Summary Schema - used in funnel cache and other places
export const PageSummarySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  order: z.number().int().positive(),
  linkingId: z.string().nullable(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  seoKeywords: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript type
export type PageSummary = z.infer<typeof PageSummarySchema>;