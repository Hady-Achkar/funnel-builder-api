import { z } from "zod";
import { $Enums } from "../../generated/prisma-client";

export const UpdateFunnelParamsSchema = z.object({
  funnelId: z
    .number({ message: "Funnel ID must be a number" })
    .int({ message: "Funnel ID must be an integer" })
    .positive({ message: "Funnel ID must be positive" }),
});

export const UpdateFunnelBodySchema = z.object({
  name: z
    .string({ message: "Funnel name must be a string" })
    .min(1, { message: "Funnel name cannot be empty" })
    .max(100, { message: "Funnel name cannot exceed 100 characters" })
    .optional(),
  status: z
    .nativeEnum($Enums.FunnelStatus, { message: "Invalid funnel status" })
    .optional(),
});

export const UpdateFunnelResponseSchema = z.object({
  data: z.object({
    id: z.number({ message: "Funnel ID must be a number" }).int().positive(),
    name: z
      .string({ message: "Funnel name is required" })
      .min(1, "Funnel name cannot be empty"),
  }),
});

export type UpdateFunnelParams = z.infer<typeof UpdateFunnelParamsSchema>;
export type UpdateFunnelBody = z.infer<typeof UpdateFunnelBodySchema>;
export type UpdateFunnelResponse = z.infer<typeof UpdateFunnelResponseSchema>;
