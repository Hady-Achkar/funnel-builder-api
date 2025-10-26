import { z } from "zod";

export const getSessionsByFunnelParams = z.object({
  funnelId: z
    .number()
    .int("Funnel ID must be an integer")
    .positive("Funnel ID must be a positive number"),
});

export type GetSessionsByFunnelParams = z.infer<
  typeof getSessionsByFunnelParams
>;

export const sessionSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  visitedPages: z.array(z.number()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getSessionsByFunnelResponse = z.object({
  sessions: z.array(sessionSchema),
  total: z.number(),
});

export type SessionSchema = z.infer<typeof sessionSchema>;
export type GetSessionsByFunnelResponse = z.infer<
  typeof getSessionsByFunnelResponse
>;
