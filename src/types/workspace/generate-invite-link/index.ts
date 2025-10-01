import { z } from "zod";
import { WorkspaceRole } from "../../../generated/prisma-client";

export const GenerateInviteLinkRequestSchema = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  role: z.nativeEnum(WorkspaceRole, { message: "Invalid workspace role" }),
  expiresIn: z.string().optional().default("7d"),
});

export const GenerateInviteLinkResponseSchema = z.object({
  link: z.string(),
  token: z.string(),
});

export const DirectLinkTokenPayloadSchema = z.object({
  workspaceId: z.number(),
  workspaceSlug: z.string(),
  role: z.string(),
  type: z.literal("workspace_direct_link"),
  linkId: z.string(),
  createdBy: z.number(),
  exp: z.number(),
});

export type GenerateInviteLinkRequest = z.infer<
  typeof GenerateInviteLinkRequestSchema
>;
export type GenerateInviteLinkResponse = z.infer<
  typeof GenerateInviteLinkResponseSchema
>;
export type DirectLinkTokenPayload = z.infer<
  typeof DirectLinkTokenPayloadSchema
>;
