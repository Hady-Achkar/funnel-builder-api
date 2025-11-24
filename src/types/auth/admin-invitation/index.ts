import { z } from "zod";
import { UserPlan } from "../../../generated/prisma-client";

// Request Schema
export const generateAdminInvitationRequestSchema = z.object({
  adminCode: z.string().min(1, "Admin code is required"),
  invitedEmail: z.string().email("Please provide a valid email address"),
  plan: z.nativeEnum(UserPlan).default(UserPlan.AGENCY),
});

// Response Schema
export const generateAdminInvitationResponseSchema = z.object({
  invitationUrl: z.string(),
  token: z.string(),
  expiresAt: z.date(),
  message: z.string(),
});

// Token Payload Schema (for validation)
export const adminInvitationTokenPayloadSchema = z.object({
  adminCode: z.string(),
  invitedEmail: z.string().email(),
  plan: z.nativeEnum(UserPlan),
  type: z.literal("admin_invitation"),
  tokenId: z.string().uuid(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

// Export inferred types
export type GenerateAdminInvitationRequest = z.infer<
  typeof generateAdminInvitationRequestSchema
>;
export type GenerateAdminInvitationResponse = z.infer<
  typeof generateAdminInvitationResponseSchema
>;
export type AdminInvitationTokenPayload = z.infer<
  typeof adminInvitationTokenPayloadSchema
>;

// For backward compatibility (optional)
export const generateAdminInvitationRequest =
  generateAdminInvitationRequestSchema;
