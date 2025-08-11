import { z } from "zod";
import { format } from "date-fns";
import { $Enums } from "../../generated/prisma-client";

export const CreateFunnelSchema = z.object({
  name: z
    .string({ message: "Funnel name must be a string" })
    .trim()
    .min(1, "Funnel name cannot be empty")
    .max(100, "Funnel name must be less than 100 characters")
    .optional()
    .default(() => format(new Date(), "dd.MM.yyyy HH:mm")),
  status: z
    .nativeEnum($Enums.FunnelStatus, {
      message: "Status must be DRAFT, LIVE, ARCHIVED, or SHARED",
    })
    .optional()
    .default($Enums.FunnelStatus.DRAFT),
});

export type CreateFunnelData = z.infer<typeof CreateFunnelSchema>;

export const CreateFunnelResponseSchema = z.object({
  message: z.string(),
  data: z.object({
    id: z.number(),
    name: z.string(),
    status: z.nativeEnum($Enums.FunnelStatus),
  }),
});

export type CreateFunnelResponse = z.infer<typeof CreateFunnelResponseSchema>;
