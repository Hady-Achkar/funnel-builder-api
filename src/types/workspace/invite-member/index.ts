import { z } from "zod";
import {
  WorkspacePermission,
  WorkspaceRole,
} from "../../../generated/prisma-client";

export const InviteMemberRequestSchema = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  email: z.string().email("Please provide a valid email address"),
  role: z.nativeEnum(WorkspaceRole, { message: "Invalid workspace role" }),
  permissions: z.array(z.nativeEnum(WorkspacePermission, { message: "Invalid workspace permission" })).optional(),
});

export type InviteMemberRequest = z.infer<typeof InviteMemberRequestSchema>;

export const InviteMemberResponseSchema = z.object({
  message: z.string(),
  member: z.object({
    id: z.number(),
    userId: z.number(),
    workspaceId: z.number(),
    role: z.nativeEnum(WorkspaceRole),
    permissions: z.array(z.nativeEnum(WorkspacePermission)),
    joinedAt: z.date(),
  }),
});

export type InviteMemberResponse = z.infer<typeof InviteMemberResponseSchema>;
