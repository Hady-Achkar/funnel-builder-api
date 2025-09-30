import { z } from "zod";

export const GetFunnelConnectionRequestSchema = z.object({
  funnelId: z.number().int().positive("Funnel ID must be a positive integer"),
});

export type GetFunnelConnectionRequest = z.infer<typeof GetFunnelConnectionRequestSchema>;

export const GetFunnelConnectionResponseSchema = z.object({
  funnel: z.object({
    id: z.number(),
    name: z.string(),
  }),
  domain: z.nullable(z.object({
    id: z.number(),
    hostname: z.string(),
  })),
  isActive: z.boolean(),
});

export type GetFunnelConnectionResponse = z.infer<typeof GetFunnelConnectionResponseSchema>;