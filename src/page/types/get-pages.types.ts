import { z } from "zod";

export const GetPageByIdParamsSchema = z.object({
  pageId: z.coerce
    .number({ message: "Page ID must be a number" })
    .int({ message: "Page ID must be an integer" })
    .positive({ message: "Page ID must be positive" }),
});

export const PageDataSchema = z.object({
  id: z
    .number({ message: "ID must be a number" })
    .int({ message: "ID must be an integer" })
    .positive({ message: "ID must be positive" }),
  name: z
    .string({ message: "Name must be a string" })
    .min(1, { message: "Name cannot be empty" }),
  content: z.string({ message: "Content must be a string" }).nullable(),
  order: z
    .number({ message: "Order must be a number" })
    .int({ message: "Order must be an integer" })
    .positive({ message: "Order must be positive" }),
  linkingId: z.string({ message: "Linking ID must be a string" }).nullable(),
  seoTitle: z.string({ message: "SEO title must be a string" }).nullable(),
  seoDescription: z
    .string({ message: "SEO description must be a string" })
    .nullable(),
  seoKeywords: z
    .string({ message: "SEO keywords must be a string" })
    .nullable(),
  funnelId: z
    .number({ message: "Funnel ID must be a number" })
    .int({ message: "Funnel ID must be an integer" })
    .positive({ message: "Funnel ID must be positive" }),
  createdAt: z.date({ message: "Created date must be a valid date" }),
  updatedAt: z.date({ message: "Updated date must be a valid date" }),
});

export const GetPageByIdResponseSchema = z.object({
  data: PageDataSchema,
  message: z
    .string({ message: "Message is required" })
    .min(1, "Message cannot be empty"),
});

export const GetPublicPageParamsSchema = z.object({
  linkingId: z
    .string({ message: "Linking ID must be a string" })
    .min(1, { message: "Linking ID cannot be empty" })
    .regex(/^[a-z0-9-]+$/, {
      message:
        "Linking ID can only contain lowercase letters, numbers, and hyphens",
    }),
  funnelId: z.coerce
    .number({ message: "Funnel ID must be a number" })
    .int({ message: "Funnel ID must be an integer" })
    .positive({ message: "Funnel ID must be positive" }),
});

export const PublicPageDataSchema = z.object({
  id: z
    .number({ message: "ID must be a number" })
    .int({ message: "ID must be an integer" })
    .positive({ message: "ID must be positive" }),
  name: z
    .string({ message: "Name must be a string" })
    .min(1, { message: "Name cannot be empty" }),
  content: z.string({ message: "Content must be a string" }).nullable(),
  linkingId: z.string({ message: "Linking ID must be a string" }).nullable(),
  seoTitle: z.string({ message: "SEO title must be a string" }).nullable(),
  seoDescription: z
    .string({ message: "SEO description must be a string" })
    .nullable(),
  seoKeywords: z
    .string({ message: "SEO keywords must be a string" })
    .nullable(),
  funnelName: z
    .string({ message: "Funnel name must be a string" })
    .min(1, { message: "Funnel name cannot be empty" }),
  funnelId: z
    .number({ message: "Funnel ID must be a number" })
    .int({ message: "Funnel ID must be an integer" })
    .positive({ message: "Funnel ID must be positive" }),
});

export const GetPublicPageResponseSchema = z.object({
  data: PublicPageDataSchema,
});

export type GetPageByIdParams = z.infer<typeof GetPageByIdParamsSchema>;
export type GetPublicPageParams = z.infer<typeof GetPublicPageParamsSchema>;
export type GetPageByIdResponse = z.infer<typeof GetPageByIdResponseSchema>;
export type GetPublicPageResponse = z.infer<typeof GetPublicPageResponseSchema>;
export type PageData = z.infer<typeof PageDataSchema>;
export type PublicPageData = z.infer<typeof PublicPageDataSchema>;
