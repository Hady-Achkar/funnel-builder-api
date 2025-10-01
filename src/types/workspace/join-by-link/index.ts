import { z } from "zod";
import {
  WorkspacePermission,
  WorkspaceRole,
} from "../../../generated/prisma-client";

export const JoinByLinkRequestSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const JoinByLinkResponseSchema = z.object({
  message: z.string(),
  workspace: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    role: z.enum(WorkspaceRole),
    permissions: z.array(z.enum(WorkspacePermission)),
  }),
});

export type JoinByLinkRequest = z.infer<typeof JoinByLinkRequestSchema>;
export type JoinByLinkResponse = z.infer<typeof JoinByLinkResponseSchema>;
