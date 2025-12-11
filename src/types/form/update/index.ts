import { z } from "zod";

export const updateFormRequest = z.object({
  name: z
    .string({
      message: "Form name must be a string",
    })
    .trim()
    .min(1, "Form name cannot be empty")
    .max(255, "Form name must be less than 255 characters")
    .optional(),
  description: z
    .string({
      message: "Form description must be a string",
    })
    .trim()
    .max(1000, "Form description must be less than 1000 characters")
    .nullable()
    .optional(),
  formContent: z
    .record(z.string(), z.any())
    .refine((content) => content && typeof content === "object", {
      message: "Form content must be a valid object",
    })
    .optional(),
  isActive: z
    .boolean({
      message: "isActive must be a boolean",
    })
    .optional(),
  
  // Webhook fields
  webhookUrl: z
    .string()
    .url("Webhook URL must be a valid URL")
    .refine((url) => url.startsWith("https://"), {
      message: "Webhook URL must use HTTPS for security",
    })
    .optional(),
  
  webhookEnabled: z.boolean().optional(),
  
  webhookHeaders: z.record(z.string(), z.string()).optional(),
  
  webhookSecret: z.string().optional(),
});

export type UpdateFormRequest = z.infer<typeof updateFormRequest>;

export const updateFormResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
});

export type UpdateFormResponse = z.infer<typeof updateFormResponse>;