import { z } from "zod";

export const deleteFormSubmissionParams = z.object({
  submissionId: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const num = typeof val === "string" ? parseInt(val, 10) : val;
      if (isNaN(num)) {
        throw new Error("Submission ID must be a valid number");
      }
      return num;
    })
    .refine((val) => val > 0, {
      message: "Submission ID must be a positive number",
    }),
});

export type DeleteFormSubmissionParams = z.infer<
  typeof deleteFormSubmissionParams
>;

export const deleteFormSubmissionResponse = z.object({
  message: z.string(),
});

export type DeleteFormSubmissionResponse = z.infer<
  typeof deleteFormSubmissionResponse
>;
