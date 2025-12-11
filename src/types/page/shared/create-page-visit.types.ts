import { z } from "zod";

export const CreatePageVisitParamsSchema = z.object({
  pageId: z.coerce
    .number({ message: "Page ID must be a number" })
    .int({ message: "Page ID must be an integer" })
    .positive({ message: "Page ID must be positive" }),
});

export const CreatePageVisitBodySchema = z.object({
  sessionId: z
    .string({ message: "Session ID must be a string" })
    .min(1, { message: "Session ID cannot be empty" })
    .max(255, { message: "Session ID cannot exceed 255 characters" }),
});

export const CreatePageVisitResponseSchema = z.object({
  message: z
    .string({ message: "Message is required" })
    .min(1, "Message cannot be empty"),
});

export type CreatePageVisitParams = z.infer<typeof CreatePageVisitParamsSchema>;
export type CreatePageVisitBody = z.infer<typeof CreatePageVisitBodySchema>;
export type CreatePageVisitResponse = z.infer<
  typeof CreatePageVisitResponseSchema
>;