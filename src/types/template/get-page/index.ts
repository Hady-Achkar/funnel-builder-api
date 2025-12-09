import { z } from "zod";
import { PageType } from "../../../generated/prisma-client";

export const getTemplatePageParams = z.object({
  templateSlug: z
    .string({ message: "Template slug is required" })
    .trim()
    .min(1, { message: "Template slug cannot be empty" }),
  linkingId: z
    .string({ message: "Page linking ID is required" })
    .trim()
    .min(1, { message: "Page linking ID cannot be empty" }),
});

export type GetTemplatePageParams = z.infer<typeof getTemplatePageParams>;

export const templatePageFullItem = z.object({
  id: z.number(),
  templateId: z.number(),
  name: z.string(),
  content: z.string().nullable(),
  order: z.number(),
  type: z.nativeEnum(PageType),
  settings: z.any().nullable(),
  linkingId: z.string().nullable(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  seoKeywords: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type TemplatePageFullItem = z.infer<typeof templatePageFullItem>;

export const getTemplatePageResponse = z.object({
  page: templatePageFullItem,
});

export type GetTemplatePageResponse = z.infer<typeof getTemplatePageResponse>;
