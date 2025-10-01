import { z } from "zod";

export const GetWorkspaceDomainsSummaryRequestSchema = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  search: z.string().min(1).optional(),
});

export type GetWorkspaceDomainsSummaryRequest = z.infer<
  typeof GetWorkspaceDomainsSummaryRequestSchema
>;

export const WorkspaceDomainSchema = z.object({
  id: z.number({ message: "Domain ID must be a number" }),
  hostname: z.string({ message: "Hostname must be a string" }),
});

export type WorkspaceDomain = z.infer<typeof WorkspaceDomainSchema>;

export const GetWorkspaceDomainsSummaryResponseSchema = z.object({
  domains: z.array(WorkspaceDomainSchema, {
    message: "Domains must be an array",
  }),
});

export type GetWorkspaceDomainsSummaryResponse = z.infer<
  typeof GetWorkspaceDomainsSummaryResponseSchema
>;
