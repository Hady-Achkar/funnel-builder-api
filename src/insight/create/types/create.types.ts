import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const createInsightRequest = z.object({
  type: z.nativeEnum($Enums.InsightType, {
    message: "Type must be QUIZ, SINGLE_CHOICE, or MULTIPLE_CHOICE",
  }),
  name: z
    .string({
      message: "Insight name must be a string",
    })
    .trim()
    .min(1, "Insight name cannot be empty")
    .max(255, "Insight name must be less than 255 characters"),
  description: z
    .string({
      message: "Insight description must be a string",
    })
    .trim()
    .max(1000, "Insight description must be less than 1000 characters")
    .optional()
    .nullable(),
  content: z
    .record(z.string(), z.any())
    .optional()
    .transform(val => val || {}),
  settings: z
    .record(z.string(), z.any())
    .optional()
    .transform(val => val || {}),
  funnelId: z
    .number({
      message: "Funnel ID must be a number",
    })
    .positive("Funnel ID must be a positive number"),
});

export type CreateInsightRequest = z.infer<typeof createInsightRequest>;

export const createInsightResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
  insightId: z.number({
    message: "Insight ID must be a number",
  }),
});

export type CreateInsightResponse = z.infer<typeof createInsightResponse>;