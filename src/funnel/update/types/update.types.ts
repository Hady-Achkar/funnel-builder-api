import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const updateFunnelParams = z.object({
  funnelId: z
    .number({ message: "Funnel ID must be a number" })
    .int({ message: "Funnel ID must be an integer" })
    .positive({ message: "Funnel ID must be positive" }),
});

export const updateFunnelRequest = z.object({
  name: z
    .string({ message: "Funnel name must be a string" })
    .min(1, { message: "Funnel name cannot be empty" })
    .max(100, { message: "Funnel name cannot exceed 100 characters" })
    .optional(),
  slug: z
    .string({ message: "Funnel slug must be a string" })
    .trim()
    .min(1, "Funnel slug cannot be empty")
    .max(100, "Funnel slug must be less than 100 characters")
    .optional(),
  status: z
    .nativeEnum($Enums.FunnelStatus, { message: "Invalid funnel status" })
    .optional(),
});

export const updateFunnelResponse = z.object({
  message: z.string(),
  funnelId: z.number(),
});

export type UpdateFunnelParams = z.infer<typeof updateFunnelParams>;
export type UpdateFunnelRequest = z.infer<typeof updateFunnelRequest>;
export type UpdateFunnelResponse = z.infer<typeof updateFunnelResponse>;