import { z } from "zod";

export const getTemplateRequest = z.object({
  id: z
    .union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Template ID must be a positive number",
    }),
});

export type GetTemplateRequest = z.infer<typeof getTemplateRequest>;

export const templatePageItem = z.object({
  id: z.number(),
  name: z.string(),
  content: z.string().nullable(),
  order: z.number(),
  linkingId: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  seoKeywords: z.string().nullable(),
  createdAt: z
    .union([z.date(), z.string()])
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
  updatedAt: z
    .union([z.date(), z.string()])
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
});

export const templateImageItem = z.object({
  id: z.number(),
  imageUrl: z.string(),
  imageType: z.enum(["THUMBNAIL", "PREVIEW"]),
  caption: z.string().nullable(),
  order: z.number(),
});

export const templateCategoryItem = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
});

export const getTemplateResponse = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  categoryId: z.number(),
  category: templateCategoryItem,
  tags: z.array(z.string()),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  createdByUserId: z.number(),
  usageCount: z.number(),
  pages: z.array(templatePageItem),
  previewImages: z.array(templateImageItem),
  createdAt: z
    .union([z.date(), z.string()])
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
  updatedAt: z
    .union([z.date(), z.string()])
    .transform((val) => (typeof val === "string" ? new Date(val) : val)),
});

export type GetTemplateResponse = z.infer<typeof getTemplateResponse>;
