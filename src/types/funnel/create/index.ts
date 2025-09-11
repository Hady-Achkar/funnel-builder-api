import z from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const createFunnelRequest = z.object({
  name: z
    .string("Name must be a string")
    .trim()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .optional(),
  slug: z
    .string({ message: "Funnel slug must be a string" })
    .trim()
    .min(1, "Funnel slug cannot be empty")
    .max(100, "Funnel slug must be less than 100 characters")
    .optional(),
  status: z
    .nativeEnum($Enums.FunnelStatus, {
      message: `Status must be one of: ${Object.values(
        $Enums.FunnelStatus
      ).join(", ")}`,
    })
    .default($Enums.FunnelStatus.DRAFT),
  workspaceSlug: z.string().trim().min(1, "Workspace slug is required"),
});

export type CreateFunnelRequest = z.infer<typeof createFunnelRequest>;
