import { z } from "zod";

export const getPublicPageRequest = z.object({
  funnelSlug: z
    .string({ message: "Funnel slug must be a string" })
    .min(1, "Funnel slug cannot be empty"),
  linkingId: z
    .string({ message: "Linking ID must be a string" })
    .min(1, "Linking ID cannot be empty"),
});

export const getPublicPageResponse = z.object({
  id: z.number({ message: "Page ID must be a number" }),
  name: z.string({ message: "Page name must be a string" }),
  content: z.any(),
  order: z.number({ message: "Page order must be a number" }),
  linkingId: z.string({ message: "Linking ID must be a string" }),
  seoTitle: z.string({ message: "SEO title must be a string" }).nullable(),
  seoDescription: z.string({ message: "SEO description must be a string" }).nullable(),
  seoKeywords: z.string({ message: "SEO keywords must be a string" }).nullable(),
  funnelId: z.number({ message: "Funnel ID must be a number" }),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type GetPublicPageRequest = z.infer<typeof getPublicPageRequest>;
export type GetPublicPageResponse = z.infer<typeof getPublicPageResponse>;