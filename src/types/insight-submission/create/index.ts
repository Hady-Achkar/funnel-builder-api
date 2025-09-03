import { z } from "zod";

export const createInsightSubmissionRequest = z.object({
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
  sessionId: z
    .string({
      message: "Session ID must be a string",
    })
    .trim()
    .min(1, "Session ID cannot be empty"),
  answers: z
    .any()
    .refine((answers) => answers !== null && answers !== undefined, {
      message: "Answers are required",
    }),
});

export type CreateInsightSubmissionRequest = z.infer<typeof createInsightSubmissionRequest>;

export const createInsightSubmissionResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
  submissionId: z.number({
    message: "Submission ID must be a number",
  }),
});

export type CreateInsightSubmissionResponse = z.infer<typeof createInsightSubmissionResponse>;