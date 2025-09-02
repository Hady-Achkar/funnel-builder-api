import { z } from "zod";

export const unlockFunnelRequest = z.object({
  funnelId: z.number()
    .int("Funnel ID must be an integer")
    .positive("Funnel ID must be a positive number"),
});

export type UnlockFunnelRequest = z.infer<typeof unlockFunnelRequest>;

export const unlockFunnelResponse = z.object({
  message: z.string(),
  success: z.boolean(),
});

export type UnlockFunnelResponse = z.infer<typeof unlockFunnelResponse>;