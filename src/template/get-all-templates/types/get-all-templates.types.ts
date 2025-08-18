import { z } from "zod";

export const getAllTemplatesQuery = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: "Page must be a positive number" })
    .default(1),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 50, {
      message: "Limit must be between 1 and 50",
    })
    .default(10),

  orderBy: z
    .enum(["createdAt", "updatedAt", "name", "usageCount"])
    .optional()
    .default("createdAt"),

  order: z.enum(["asc", "desc"]).optional().default("desc"),

  category: z.string().trim().optional(),
});

export type GetAllTemplatesQuery = z.infer<typeof getAllTemplatesQuery>;

export const templateSummaryItem = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  categoryId: z.number(),
  categoryName: z.string(),
  tags: z.array(z.string()),
  createdByUserId: z.number(),
  usageCount: z.number(),
  pagesCount: z.number(),
  thumbnailUrl: z.string().nullable(),
  previewUrls: z.array(z.string()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TemplateSummaryItem = z.infer<typeof templateSummaryItem>;

export const getAllTemplatesResponse = z.object({
  templates: z.array(templateSummaryItem),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
  filters: z.object({
    orderBy: z.string(),
    order: z.string(),
    category: z.string().optional(),
  }),
});

export type GetAllTemplatesResponse = z.infer<typeof getAllTemplatesResponse>;
