import { z } from "zod";

export const DeleteFunnelParamsSchema = z.object({
  funnelId: z
    .number({ message: "Funnel ID must be a number" })
    .int({ message: "Funnel ID must be an integer" })
    .positive({ message: "Funnel ID must be positive" }),
});

export const DeleteFunnelResponseSchema = z.object({
  name: z
    .string({ message: "Funnel name is required" })
    .min(1, "Funnel name cannot be empty"),
});

export type DeleteFunnelParams = z.infer<typeof DeleteFunnelParamsSchema>;
export type DeleteFunnelResponse = z.infer<typeof DeleteFunnelResponseSchema>;
