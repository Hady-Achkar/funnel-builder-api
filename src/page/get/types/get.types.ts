import { z } from "zod";
import { PageType } from "../../../generated/prisma-client";

export const getPageRequest = z.object({
  pageId: z.coerce
    .number({
      message: "Page ID must be a number",
    })
    .positive("Page ID must be a positive number"),
});

export type GetPageRequest = z.infer<typeof getPageRequest>;

export const getPageResponse = z.object({
  id: z.number(),
  name: z.string(),
  content: z.string(),
  order: z.number(),
  type: z.nativeEnum(PageType),
  linkingId: z.string(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  seoKeywords: z.string().nullable(),
  funnelId: z.number(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type GetPageResponse = z.infer<typeof getPageResponse>;