import { z } from "zod";

export const GetWorkspaceFunnelsSummaryRequestSchema = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  search: z
    .string({
      message: "Search must be a string",
    })
    .min(1, { message: "Search cannot be empty" })
    .optional(),
});

export type GetWorkspaceFunnelsSummaryRequest = z.infer<typeof GetWorkspaceFunnelsSummaryRequestSchema>;

export const WorkspaceFunnelSchema = z.object({
  id: z.number({ message: "Funnel ID must be a number" }),
  name: z.string({ message: "Funnel name must be a string" }),
});

export type WorkspaceFunnel = z.infer<typeof WorkspaceFunnelSchema>;

export const GetWorkspaceFunnelsSummaryResponseSchema = z.object({
  funnels: z.array(WorkspaceFunnelSchema, {
    message: "Funnels must be an array",
  }),
});

export type GetWorkspaceFunnelsSummaryResponse = z.infer<typeof GetWorkspaceFunnelsSummaryResponseSchema>;