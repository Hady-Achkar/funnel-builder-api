import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const WorkspaceSummarySchema = z.object({
  id: z.number({ message: "Workspace ID must be a number" }),
  name: z.string({ message: "Workspace name must be a string" }),
  image: z.string().nullable(),
  role: z.enum($Enums.WorkspaceRole, {
    message: `Role must be one of: ${Object.values($Enums.WorkspaceRole).join(", ")}`,
  }),
});

export type WorkspaceSummary = z.infer<typeof WorkspaceSummarySchema>;

export const GetUserWorkspacesSummaryResponseSchema = z.array(WorkspaceSummarySchema, {
  message: "Workspaces must be an array",
});

export type GetUserWorkspacesSummaryResponse = z.infer<typeof GetUserWorkspacesSummaryResponseSchema>;