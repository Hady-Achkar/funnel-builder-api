import { z } from "zod";

export const lockFunnelRequest = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  funnelSlug: z.string().min(1, "Funnel slug is required"),
  password: z.string()
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password must not exceed 100 characters"),
});

export type LockFunnelRequest = z.infer<typeof lockFunnelRequest>;

export const lockFunnelResponse = z.object({
  message: z.string(),
  success: z.boolean(),
});

export type LockFunnelResponse = z.infer<typeof lockFunnelResponse>;