import { z } from "zod";

export const GetFunnelConnectionRequestSchema = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
  funnelSlug: z.string().min(1, "Funnel slug is required"),
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