import { z } from "zod";

export const getSessionsByFunnelParams = z.object({
  workspaceSlug: z
    .string()
    .min(1, "Workspace slug is required")
    .regex(/^[a-z0-9-]+$/, "Invalid workspace slug format"),
  funnelSlug: z
    .string()
    .min(1, "Funnel slug is required")
    .regex(/^[a-z0-9-]+$/, "Invalid funnel slug format"),
  startDate: z
    .union([z.string(), z.date()])
    .transform((val) => {
      if (!val) return undefined;
      if (val instanceof Date) return val;
      return new Date(val);
    })
    .optional(),
  endDate: z
    .union([z.string(), z.date()])
    .transform((val) => {
      if (!val) return undefined;
      if (val instanceof Date) return val;
      return new Date(val);
    })
    .optional(),
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

export const pageSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const getSessionsByFunnelResponse = z.object({
  sessions: z.array(sessionSchema),
  total: z.number(),
  pages: z.array(pageSchema),
});

export type SessionSchema = z.infer<typeof sessionSchema>;
export type GetSessionsByFunnelResponse = z.infer<
  typeof getSessionsByFunnelResponse
>;
