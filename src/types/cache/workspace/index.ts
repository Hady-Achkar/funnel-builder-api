import { z } from "zod";
import { cachedFunnelSummary } from "../funnel";

// Workspace cache contains array of funnel summaries
// Used for cache key: workspace:{id}:funnels:all
export const cachedWorkspaceFunnels = z.array(cachedFunnelSummary);

// Inferred type
export type CachedWorkspaceFunnels = z.infer<typeof cachedWorkspaceFunnels>;