import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const updateInsightRequest = z.object({
  insightId: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      if (isNaN(num)) {
        throw new Error("Insight ID must be a valid number");
      }
      return num;
    })
    .refine((val) => val > 0, {
      message: "Insight ID must be a positive number",
    }),
  type: z.nativeEnum($Enums.InsightType, {
    message: "Type must be QUIZ, SINGLE_CHOICE, or MULTIPLE_CHOICE",
  }).optional(),
  name: z
    .string({
      message: "Insight name must be a string",
    })
    .trim()
    .min(1, "Insight name cannot be empty")
    .max(255, "Insight name must be less than 255 characters")
    .optional(),
  description: z
    .string({
      message: "Insight description must be a string",
    })
    .trim()
    .max(1000, "Insight description must be less than 1000 characters")
    .optional()
    .nullable(),
  content: z
    .any()
    .optional(),
  settings: z
    .record(z.string(), z.any())
    .optional()
    .transform(val => val || {}),
});

export type UpdateInsightRequest = z.infer<typeof updateInsightRequest>;

export const updateInsightResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
  insightId: z.number({
    message: "Insight ID must be a number",
  }),
});

export type UpdateInsightResponse = z.infer<typeof updateInsightResponse>;