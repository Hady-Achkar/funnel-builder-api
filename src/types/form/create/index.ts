import { z } from "zod";

export const createFormRequest = z.object({
  name: z
    .string({
      message: "Form name must be a string",
    })
    .trim()
    .min(1, "Form name cannot be empty")
    .max(255, "Form name must be less than 255 characters"),
  description: z
    .string({
      message: "Form description must be a string",
    })
    .trim()
    .max(1000, "Form description must be less than 1000 characters")
    .optional()
    .nullable(),
  formContent: z
    .record(z.string(), z.any())
    .refine((content) => content && typeof content === "object", {
      message: "Form content must be a valid object",
    }),
  isActive: z
    .boolean({
      message: "isActive must be a boolean",
    })
    .default(true)
    .optional(),
  funnelId: z
    .number({
      message: "Funnel ID must be a number",
    })
    .positive("Funnel ID must be a positive number")
    .optional()
    .nullable(),
  webhookUrl: z
    .string({
      message: "Webhook URL must be a string",
    })
    .url("Webhook URL must be a valid URL")
    .refine((url) => url.startsWith("https://"), {
      message: "Webhook URL must use HTTPS for security",
    })
    .optional(),
  webhookEnabled: z
    .boolean({
      message: "webhookEnabled must be a boolean",
    })
    .default(false)
    .optional(),
  webhookHeaders: z.record(z.string(), z.string()).optional(),
  webhookSecret: z
    .string({
      message: "Webhook secret must be a string",
    })
    .optional(),
});

export type CreateFormRequest = z.infer<typeof createFormRequest>;

export const createFormResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
  formId: z.number({
    message: "Form ID must be a number",
  }),
});

export type CreateFormResponse = z.infer<typeof createFormResponse>;
