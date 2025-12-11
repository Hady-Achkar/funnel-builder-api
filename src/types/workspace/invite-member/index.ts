import { z } from "zod";
import {
  WorkspacePermission,
  WorkspaceRole,
} from "../../../generated/prisma-client";

export const InviteMemberRequestSchema = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  email: z.string().email("Please provide a valid email address"),
  role: z.enum(WorkspaceRole, { message: "Invalid workspace role" }),
});

export const InviteMemberResponseSchema = z.object({
  message: z.string(),
});

export type InviteMemberRequest = z.infer<typeof InviteMemberRequestSchema>;
export type InviteMemberResponse = z.infer<typeof InviteMemberResponseSchema>;
