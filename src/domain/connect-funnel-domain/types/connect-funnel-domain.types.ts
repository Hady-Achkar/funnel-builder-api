import { z } from "zod";

export const ConnectFunnelDomainRequestSchema = z.object({
  funnelId: z
    .number({
      message: "Funnel ID must be a valid number",
    })
    .int({ message: "Funnel ID must be an integer" })
    .positive({ message: "Funnel ID must be positive" }),
  domainId: z
    .number({
      message: "Domain ID must be a valid number",
    })
    .int({ message: "Domain ID must be an integer" })
    .positive({ message: "Domain ID must be positive" }),
  workspaceId: z
    .number({
      message: "Workspace ID must be a valid number",
    })
    .int({ message: "Workspace ID must be an integer" })
    .positive({ message: "Workspace ID must be positive" }),
});

export type ConnectFunnelDomainRequest = z.infer<
  typeof ConnectFunnelDomainRequestSchema
>;

export const ConnectFunnelDomainResponseSchema = z.object({
  message: z.string({ message: "Message must be a string" }),
});

export type ConnectFunnelDomainResponse = z.infer<
  typeof ConnectFunnelDomainResponseSchema
>;