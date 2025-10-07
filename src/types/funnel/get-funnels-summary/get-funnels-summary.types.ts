import { z } from "zod";

export const GetFunnelsSummaryRequestSchema = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  search: z
    .string({
      message: "Search must be a string",
    })
    .min(1, { message: "Search cannot be empty" })
    .optional(),
});

export type GetFunnelsSummaryRequest = z.infer<typeof GetFunnelsSummaryRequestSchema>;

export const FunnelSummarySchema = z.object({
  id: z.number({ message: "Funnel ID must be a number" }),
  name: z.string({ message: "Funnel name must be a string" }),
});

export type FunnelSummary = z.infer<typeof FunnelSummarySchema>;

export const GetFunnelsSummaryResponseSchema = z.object({
  funnels: z.array(FunnelSummarySchema, {
    message: "Funnels must be an array",
  }),
});

export type GetFunnelsSummaryResponse = z.infer<typeof GetFunnelsSummaryResponseSchema>;
