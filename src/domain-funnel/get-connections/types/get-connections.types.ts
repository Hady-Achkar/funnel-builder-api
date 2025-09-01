import { z } from "zod";

export const GetConnectionsRequestSchema = z.object({
  workspaceId: z
    .number({
      message: "Workspace ID must be a valid number",
    })
    .int({ message: "Workspace ID must be an integer" })
    .positive({ message: "Workspace ID must be positive" }),
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