import { z } from "zod";

export const DeletePageParamsSchema = z.object({
  pageId: z.coerce
    .number()
    .int()
    .positive({ message: "Page ID must be positive" }),
});

export const DeletePageResponseSchema = z.object({
  message: z
    .string({ message: "Message is required" })
    .min(1, "Message cannot be empty"),
});

export type DeletePageParams = z.infer<typeof DeletePageParamsSchema>;
export type DeletePageResponse = z.infer<typeof DeletePageResponseSchema>;
