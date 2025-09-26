import { z } from "zod";

export const leaveWorkspaceParams = z.object({
  slug: z.string().min(1, "Workspace slug is required"),
});

export const leaveWorkspaceResponse = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type LeaveWorkspaceParams = z.infer<typeof leaveWorkspaceParams>;
export type LeaveWorkspaceResponse = z.infer<typeof leaveWorkspaceResponse>;
