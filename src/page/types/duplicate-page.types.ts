import { z } from "zod";

export const DuplicatePageParamsSchema = z.object({
  pageId: z.coerce
    .number({ message: "Page ID must be a number" })
    .int({ message: "Page ID must be an integer" })
    .positive({ message: "Page ID must be positive" }),
});

export const DuplicatePageBodySchema = z.object({
  targetFunnelId: z.coerce
    .number({ message: "Target funnel ID must be a number" })
    .int({ message: "Target funnel ID must be an integer" })
    .positive({ message: "Target funnel ID must be positive" })
    .optional(),
  newName: z
    .string({ message: "New name must be a string" })
    .min(1, { message: "New name cannot be empty" })
    .max(100, { message: "New name cannot exceed 100 characters" })
    .optional(),
  newLinkingId: z
    .string({ message: "New linking ID must be a string" })
    .min(1, { message: "New linking ID cannot be empty" })
    .max(50, { message: "New linking ID cannot exceed 50 characters" })
    .regex(
      /^[a-z0-9-]+$/,
      { message: "Linking ID can only contain lowercase letters, numbers, and hyphens" }
    )
    .optional(),
});

export const DuplicatePageResponseSchema = z.object({
  message: z
    .string({ message: "Message is required" })
    .min(1, "Message cannot be empty"),
});

// TypeScript types
export type DuplicatePageParams = z.infer<typeof DuplicatePageParamsSchema>;
export type DuplicatePageBody = z.infer<typeof DuplicatePageBodySchema>;
export type DuplicatePageResponse = z.infer<typeof DuplicatePageResponseSchema>;
