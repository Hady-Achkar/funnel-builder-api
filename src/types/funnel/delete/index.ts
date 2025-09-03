import { z } from "zod";

export const deleteFunnelParams = z.object({
  funnelId: z.number().int().positive(),
});

export const deleteFunnelResponse = z.object({
  message: z.string(),
});

export type DeleteFunnelParams = z.infer<typeof deleteFunnelParams>;
export type DeleteFunnelResponse = z.infer<typeof deleteFunnelResponse>;