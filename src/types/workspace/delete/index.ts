import { z } from "zod";

export const deleteWorkspaceParams = z.object({
  slug: z.string().min(1, "Workspace slug is required"),
});

export const deleteWorkspaceResponse = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type DeleteWorkspaceParams = z.infer<typeof deleteWorkspaceParams>;
export type DeleteWorkspaceResponse = z.infer<typeof deleteWorkspaceResponse>;