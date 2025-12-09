import { z } from "zod";
import { BorderRadius, PageType } from "../../../generated/prisma-client";

export const getTemplatePagesParams = z.object({
  templateSlug: z
    .string({ message: "Template slug is required" })
    .trim()
    .min(1, { message: "Template slug cannot be empty" }),
});

export type GetTemplatePagesParams = z.infer<typeof getTemplatePagesParams>;

export const templatePageItem = z.object({
  id: z.number(),
  templateId: z.number(),
  name: z.string(),
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

export type TemplatePageItem = z.infer<typeof templatePageItem>;

export const templateTheme = z.object({
  backgroundColor: z.string(),
  textColor: z.string(),
  buttonColor: z.string(),
  buttonTextColor: z.string(),
  borderColor: z.string(),
  optionColor: z.string(),
  fontFamily: z.string(),
  borderRadius: z.nativeEnum(BorderRadius),
});

export type TemplateTheme = z.infer<typeof templateTheme>;

export const getTemplatePagesResponse = z.object({
  pages: z.array(templatePageItem),
  theme: templateTheme.nullable(),
});

export type GetTemplatePagesResponse = z.infer<typeof getTemplatePagesResponse>;
