import { z } from "zod";
import { $Enums } from "../../generated/prisma-client";

export const FunnelListQuerySchema = z.object({
  page: z.coerce
    .number({ message: "Page must be a number" })
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .optional()
    .default(1),
  limit: z.coerce
    .number({ message: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .optional()
    .default(10),
  status: z
    .nativeEnum($Enums.FunnelStatus, {
      message: "Status must be DRAFT, LIVE, ARCHIVED, or SHARED",
    })
    .optional(),
  sortBy: z
    .enum(["name", "status", "createdAt", "updatedAt"], {
      message: "Sort by must be name, status, createdAt, or updatedAt",
    })
    .optional()
    .default("createdAt"),
  sortOrder: z
    .enum(["asc", "desc"], {
      message: "Sort order must be asc or desc",
    })
    .optional()
    .default("desc"),
});

export const FunnelListItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  status: z.nativeEnum($Enums.FunnelStatus),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const FunnelListResponseSchema = z.object({
  data: z.array(FunnelListItemSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    totalPages: z.number().int().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// TypeScript types inferred from Zod schemas
export type FunnelListQuery = z.infer<typeof FunnelListQuerySchema>;
export type FunnelListItem = z.infer<typeof FunnelListItemSchema>;
export type FunnelListResponse = z.infer<typeof FunnelListResponseSchema>;
