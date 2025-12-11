import { z } from "zod";
import {
  WorkspacePermission,
  WorkspaceRole,
} from "../../../generated/prisma-client";

export const AcceptInvitationRequestSchema = z.object({
  token: z
    .string()
    .min(1, "Token is required")
    .transform((val) => {
      return val.split(/[&?]/)[0].trim();
    }),
});

export const AcceptInvitationResponseSchema = z.object({
  message: z.string(),
  workspace: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
    role: z.enum(WorkspaceRole),
    permissions: z.array(z.enum(WorkspacePermission)),
  }),
});

export const InvitationTokenPayloadSchema = z.object({
  workspaceId: z.number(),
  workspaceSlug: z.string(),
  role: z.string(),
  email: z.string().email(),
  type: z.string(),
  exp: z.number(),
});

export type AcceptInvitationRequest = z.infer<
  typeof AcceptInvitationRequestSchema
>;
export type AcceptInvitationResponse = z.infer<
  typeof AcceptInvitationResponseSchema
>;
export type InvitationTokenPayload = z.infer<
  typeof InvitationTokenPayloadSchema
>;
