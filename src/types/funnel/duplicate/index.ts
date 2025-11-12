import { z } from "zod";

export const duplicateFunnelParams = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  funnelSlug: z.string().min(1, "Funnel slug is required"),
});

export const duplicateFunnelRequest = z.object({
  name: z
    .string()
    .min(1, { message: "Funnel name cannot be empty" })
    .max(255, { message: "Funnel name cannot exceed 255 characters" })
    .optional(),
  workspaceSlug: z.string().min(1, "Workspace slug is required").optional(),
});

export const duplicateFunnelResponse = z.object({
  message: z.string(),
  funnelId: z.number(),
});

export type DuplicateFunnelParams = z.infer<typeof duplicateFunnelParams>;
export type DuplicateFunnelRequest = z.infer<typeof duplicateFunnelRequest>;
export type DuplicateFunnelResponse = z.infer<typeof duplicateFunnelResponse>;