import { z } from "zod";
import { UserPlan } from "../../../generated/prisma-client";

export const GenerateAffiliateLinkRequest = z.object({
  name: z
    .string()
    .min(1, "Please provide a name for your affiliate link")
    .max(100, "Link name is too long. Please use 100 characters or less")
    .trim(),
  workspaceId: z
    .number()
    .int("Please select a valid workspace")
    .positive("Please select a valid workspace"),
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
