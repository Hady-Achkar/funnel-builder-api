import { z } from "zod";

export const createFormSubmissionRequest = z.object({
  formId: z
    .number({
      message: "Form ID must be a number",
    })
    .positive("Form ID must be a positive number"),
  sessionId: z
    .string({
      message: "Session ID must be a string",
    })
    .trim()
    .min(1, "Session ID cannot be empty"),
  submittedData: z
    .record(z.string(), z.any())
    .optional()
    .nullable(),
  isCompleted: z
    .boolean({
      message: "isCompleted must be a boolean",
    })
    .default(true)
    .optional(),
});

export type CreateFormSubmissionRequest = z.infer<typeof createFormSubmissionRequest>;

export const createFormSubmissionResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
  submissionId: z.number({
    message: "Submission ID must be a number",
  }),
});

export type CreateFormSubmissionResponse = z.infer<typeof createFormSubmissionResponse>;