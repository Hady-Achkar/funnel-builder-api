import { z } from "zod";

export const UpdatePageParamsSchema = z.object({
  pageId: z.coerce
    .number()
    .int()
    .positive({ message: "Page ID must be positive" }),
});

export const UpdatePageBodySchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  content: z.string().optional(),
  order: z.coerce
    .number()
    .int()
    .positive({ message: "Order must be positive" })
    .optional(),
  linkingId: z
    .string()
    .min(1, "Linking ID cannot be empty")
    .regex(
      /^[a-z0-9-]+$/,
      "Linking ID can only contain lowercase letters, numbers, and hyphens"
    )
    .optional(),
  seoTitle: z.string().min(1, "SEO title cannot be empty").optional(),
  seoDescription: z
    .string()
    .min(1, "SEO description cannot be empty")
    .optional(),
  seoKeywords: z.string().min(1, "SEO keywords cannot be empty").optional(),
});

export const UpdatePageResponseSchema = z.object({
  message: z
    .string({ message: "Message is required" })
    .min(1, "Message cannot be empty"),
});

export type UpdatePageParams = z.infer<typeof UpdatePageParamsSchema>;
export type UpdatePageBody = z.infer<typeof UpdatePageBodySchema>;
export type UpdatePageResponse = z.infer<typeof UpdatePageResponseSchema>;
