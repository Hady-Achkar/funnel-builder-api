import { z } from "zod";

export const deleteInsightRequest = z.object({
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
});

export type DeleteInsightRequest = z.infer<typeof deleteInsightRequest>;

export const deleteInsightResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
});

export type DeleteInsightResponse = z.infer<typeof deleteInsightResponse>;