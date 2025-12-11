import { z } from "zod";

export const deleteFunnelParams = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  funnelSlug: z.string().min(1, "Funnel slug is required"),
});

export const deleteFunnelResponse = z.object({
  message: z.string(),
});

export type DeleteFunnelParams = z.infer<typeof deleteFunnelParams>;
export type DeleteFunnelResponse = z.infer<typeof deleteFunnelResponse>;