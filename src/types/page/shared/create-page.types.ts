import { z } from "zod";

export const CreatePageParamsSchema = z.object({
  funnelId: z.coerce
    .number({ message: "Funnel ID must be a number" })
    .int({ message: "Funnel ID must be an integer" })
    .positive({ message: "Funnel ID must be positive" }),
});

export const CreatePageBodySchema = z.object({
  name: z
    .string({ message: "Page name must be a string" })
    .min(1, { message: "Page name cannot be empty" })
    .max(100, { message: "Page name cannot exceed 100 characters" })
    .optional(),
  content: z.string({ message: "Page content must be a string" }).optional(),
  linkingId: z
    .string({ message: "Linking ID must be a string" })
    .min(1, { message: "Linking ID cannot be empty" })
    .max(50, { message: "Linking ID cannot exceed 50 characters" })
    .regex(/^[a-z0-9-]+$/, {
      message:
        "Linking ID can only contain lowercase letters, numbers, and hyphens",
    })
    .optional(),
  seoTitle: z
    .string({ message: "SEO title must be a string" })
    .max(60, { message: "SEO title cannot exceed 60 characters" })
    .optional(),
  seoDescription: z
    .string({ message: "SEO description must be a string" })
    .max(160, { message: "SEO description cannot exceed 160 characters" })
    .optional(),
  seoKeywords: z
    .string({ message: "SEO keywords must be a string" })
    .max(200, { message: "SEO keywords cannot exceed 200 characters" })
    .optional(),
});

export const CreatePageResponseSchema = z.object({
  message: z
    .string({ message: "Message is required" })
    .min(1, "Message cannot be empty"),
});

// Validated types (after Zod parsing)
export type CreatePageParams = z.infer<typeof CreatePageParamsSchema>;
export type CreatePageBody = z.infer<typeof CreatePageBodySchema>;
export type CreatePageResponse = z.infer<typeof CreatePageResponseSchema>;

// Backward compatibility
export type CreatePageRequest = CreatePageBody;