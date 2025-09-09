import { z } from "zod";

// Funnel summary (without pages) - used in workspace funnel lists
export const cachedFunnelSummary = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  status: z.string(),
  workspaceId: z.number(),
  createdBy: z.number(),
  themeId: z.number(),
  createdAt: z.any(),
  updatedAt: z.any(),
  theme: z.any(),
});

// Funnel full (with pages summary array) - for individual funnel details
export const cachedFunnelFull = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  status: z.string(),
  workspaceId: z.number(),
  createdBy: z.number(),
  themeId: z.number(),
  createdAt: z.any(),
  updatedAt: z.any(),
  theme: z.any(),
  pages: z.array(z.any()), // Page summaries without content
});

// Inferred types
export type CachedFunnelSummary = z.infer<typeof cachedFunnelSummary>;
export type CachedFunnelFull = z.infer<typeof cachedFunnelFull>;