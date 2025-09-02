import { z } from "zod";

export const lockFunnelRequest = z.object({
  funnelId: z.number()
    .int("Funnel ID must be an integer")
    .positive("Funnel ID must be a positive number"),
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