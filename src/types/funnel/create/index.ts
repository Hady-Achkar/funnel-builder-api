import { z } from "zod";
import { format } from "date-fns";
import { $Enums } from "../../../generated/prisma-client";

export const createFunnelRequest = z.object({
  name: z
    .string({ message: "Funnel name must be a string" })
    .trim()
    .min(1, "Funnel name cannot be empty")
    .max(100, "Funnel name must be less than 100 characters")
    .optional()
    .default(() => format(new Date(), "dd.MM.yyyy HH:mm")),
  slug: z
    .string({ message: "Funnel slug must be a string" })
    .trim()
    .min(1, "Funnel slug cannot be empty")
    .max(100, "Funnel slug must be less than 100 characters")
    .optional(),
  status: z
    .nativeEnum($Enums.FunnelStatus, {
      message: "Status must be DRAFT, LIVE, ARCHIVED, or SHARED",
    })
    .optional()
    .default($Enums.FunnelStatus.DRAFT),
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
});

export type CreateFunnelRequest = z.infer<typeof createFunnelRequest>;

export const createFunnelResponse = z.object({
  message: z.string(),
  funnelId: z.number(),
});

export type CreateFunnelResponse = z.infer<typeof createFunnelResponse>;