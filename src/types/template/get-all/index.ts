import { z } from "zod";

export const getAllTemplatesQuery = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: "Page must be a positive number" }),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 50, {
      message: "Limit must be between 1 and 50",
    }),

  search: z.string().trim().optional(),

  orderBy: z
    .enum(["createdAt", "updatedAt", "name", "usageCount", "pagesCount"])
    .optional()
    .default("createdAt"),

  order: z.enum(["asc", "desc"]).optional().default("desc"),

  categoryId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),

  categorySlug: z.string().trim().optional(),

  isActive: z
    .string()
    .optional()
    .transform((val) =>
      val === "true" ? true : val === "false" ? false : undefined
    ),

  isPublic: z
    .string()
    .optional()
    .transform((val) =>
      val === "true" ? true : val === "false" ? false : undefined
    ),

  createdByUserId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),

  tags: z.string().optional(),
});

export type GetAllTemplatesQuery = z.infer<typeof getAllTemplatesQuery>;

export const templateSummaryItem = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  categoryId: z.number(),
  categoryName: z.string(),
  categorySlug: z.string(),
  tags: z.array(z.string()),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  createdByUserId: z.number(),
  usageCount: z.number(),
  pagesCount: z.number(),
  imagesCount: z.number(),
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
    search: z.string().nullable(),
    orderBy: z.string(),
    order: z.string(),
    categoryId: z.number().nullable(),
    categorySlug: z.string().nullable(),
    isActive: z.boolean().nullable(),
    isPublic: z.boolean().nullable(),
    createdByUserId: z.number().nullable(),
    tags: z.string().nullable(),
  }),
});

export type GetAllTemplatesResponse = z.infer<typeof getAllTemplatesResponse>;
