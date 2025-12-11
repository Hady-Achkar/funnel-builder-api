import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

// Request Schema
export const getUserWorkspacesSummaryRequestSchema = z.object({
  search: z.string().optional(),
});

export type GetUserWorkspacesSummaryRequest = z.infer<typeof getUserWorkspacesSummaryRequestSchema>;

// Workspace Summary Schema
export const WorkspaceSummarySchema = z.object({
  id: z.number({ message: "Workspace ID must be a number" }),
  name: z.string({ message: "Workspace name must be a string" }),
  slug: z.string({ message: "Workspace slug must be a string" }),
  image: z.string().nullable(),
  role: z.enum($Enums.WorkspaceRole, {
    message: `Role must be one of: ${Object.values($Enums.WorkspaceRole).join(", ")}`,
  }),
});

export type WorkspaceSummary = z.infer<typeof WorkspaceSummarySchema>;

// Response Schema
export const GetUserWorkspacesSummaryResponseSchema = z.array(WorkspaceSummarySchema, {
  message: "Workspaces must be an array",
});

export type GetUserWorkspacesSummaryResponse = z.infer<typeof GetUserWorkspacesSummaryResponseSchema>;