import { z } from "zod";

export const CachedPageSchema = z.object({
  id: z.number({ message: "ID must be a number" }),
  name: z.string({ message: "Name must be a string" }),
  content: z.string({ message: "Content must be a string" }),
  order: z.number({ message: "Order must be a number" }),
  linkingId: z.string({ message: "Linking ID must be a string" }),
  seoTitle: z.string({ message: "SEO title must be a string" }).nullable(),
  seoDescription: z
    .string({ message: "SEO description must be a string" })
    .nullable(),
  seoKeywords: z
    .string({ message: "SEO keywords must be a string" })
    .nullable(),
  visits: z.number({ message: "Visits must be a number" }),
  funnelId: z.number({ message: "Funnel ID must be a number" }),
  createdAt: z.string({ message: "Created at must be a valid timestamp" }),
  updatedAt: z.string({ message: "Updated at must be a valid timestamp" }),
});

export type CachedPage = z.infer<typeof CachedPageSchema>;
