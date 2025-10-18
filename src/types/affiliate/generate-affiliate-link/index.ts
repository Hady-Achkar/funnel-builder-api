import { z } from "zod";
import { UserPlan } from "../../../generated/prisma-client";

export const GenerateAffiliateLinkRequest = z.object({
  name: z
    .string()
    .min(1, "Please provide a name for your affiliate link")
    .max(100, "Link name is too long. Please use 100 characters or less")
    .trim(),
  workspaceSlug: z
    .string()
    .min(1, "Please provide a workspace slug")
    .max(100, "Workspace slug is too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Workspace slug must contain only lowercase letters, numbers, and hyphens"
    )
    .trim(),
  planType: z
    .nativeEnum(UserPlan)
    .optional()
    .default(UserPlan.BUSINESS), // Default to BUSINESS if not provided
  settings: z.record(z.string(), z.any()).optional().default({}),
});

export type GenerateAffiliateLinkRequest = z.infer<
  typeof GenerateAffiliateLinkRequest
>;

export const GenerateAffiliateLinkResponse = z.object({
  message: z.string(),
  id: z.number(),
  url: z.string(),
  token: z.string(),
});

export type GenerateAffiliateLinkResponse = z.infer<
  typeof GenerateAffiliateLinkResponse
>;
