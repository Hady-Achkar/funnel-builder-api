import { z } from "zod";

export const createPageVisitParams = z.object({
  pageId: z.coerce
    .number({ message: "Page ID must be a number" })
    .int({ message: "Page ID must be an integer" })
    .positive({ message: "Page ID must be positive" }),
});

export const createPageVisitRequest = z.object({
  sessionId: z
    .string({ message: "Session ID must be a string" })
    .min(1, { message: "Session ID cannot be empty" })
    .max(255, { message: "Session ID cannot exceed 255 characters" }),
});

export const createPageVisitResponse = z.object({
  message: z
    .string({ message: "Message is required" })
    .min(1, "Message cannot be empty"),
  isNewVisit: z.boolean().optional(),
});

export type CreatePageVisitParams = z.infer<typeof createPageVisitParams>;
export type CreatePageVisitRequest = z.infer<typeof createPageVisitRequest>;
export type CreatePageVisitResponse = z.infer<typeof createPageVisitResponse>;