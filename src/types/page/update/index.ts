import { z } from "zod";
import { PageType } from "../../../generated/prisma-client";

export const updatePageParams = z.object({
  id: z.coerce.number({ message: "Page ID must be a number" }),
});

export const updatePageRequest = z.object({
  name: z
    .string({ message: "Page name must be a string" })
    .min(1, "Page name cannot be empty")
    .max(255, "Page name cannot exceed 255 characters")
    .optional(),
  content: z.string({ message: "Page content must be a string" }).optional(),
  type: z.enum(PageType).optional(),
  linkingId: z
    .string({ message: "Linking ID must be a string" })
    .min(1, "Linking ID cannot be empty")
    .regex(
      /^[a-z0-9-]+$/,
      "Linking ID can only contain lowercase letters, numbers, and hyphens"
    )
    .optional(),
  seoTitle: z
    .string({ message: "SEO title must be a string" })
    .max(60, "SEO title cannot exceed 60 characters")
    .nullable()
    .optional(),
  seoDescription: z
    .string({ message: "SEO description must be a string" })
    .max(160, "SEO description cannot exceed 160 characters")
    .nullable()
    .optional(),
  seoKeywords: z
    .string({ message: "SEO keywords must be a string" })
    .max(255, "SEO keywords cannot exceed 255 characters")
    .nullable()
    .optional(),
});

export const updatePageResponse = z.object({
  message: z.string({ message: "Message must be a string" }),
  page: z.object({
    id: z.number({ message: "Page ID must be a number" }),
    name: z.string({ message: "Page name must be a string" }),
    content: z.string({ message: "Page content must be a string" }),
    order: z.number({ message: "Page order must be a number" }),
    type: z.enum(PageType),
    linkingId: z.string({ message: "Linking ID must be a string" }),
    seoTitle: z.string({ message: "SEO title must be a string" }).nullable(),
    seoDescription: z
      .string({ message: "SEO description must be a string" })
      .nullable(),
    seoKeywords: z
      .string({ message: "SEO keywords must be a string" })
      .nullable(),
    funnelId: z.number({ message: "Funnel ID must be a number" }),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
  }),
});

export type UpdatePageParams = z.infer<typeof updatePageParams>;
export type UpdatePageParamsInput = {
  id: string;
};
export type UpdatePageRequest = z.infer<typeof updatePageRequest>;
export type UpdatePageResponse = z.infer<typeof updatePageResponse>;
