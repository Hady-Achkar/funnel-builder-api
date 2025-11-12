import { z } from "zod";

export const unlockFunnelRequest = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  funnelSlug: z.string().min(1, "Funnel slug is required"),
});

export type UnlockFunnelRequest = z.infer<typeof unlockFunnelRequest>;

export const unlockFunnelResponse = z.object({
  message: z.string(),
  success: z.boolean(),
});

export type UnlockFunnelResponse = z.infer<typeof unlockFunnelResponse>;