import { z } from "zod";

export const GetConnectionsRequestSchema = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
});

export type GetConnectionsRequest = z.infer<typeof GetConnectionsRequestSchema>;

export const ConnectionItemSchema = z.object({
  funnelId: z.number(),
  funnelName: z.string(),
  domainId: z.number(),
  domainName: z.string(),
});

export type ConnectionItem = z.infer<typeof ConnectionItemSchema>;

export const GetConnectionsResponseSchema = z.object({
  connections: z.array(ConnectionItemSchema),
});

export type GetConnectionsResponse = z.infer<typeof GetConnectionsResponseSchema>;