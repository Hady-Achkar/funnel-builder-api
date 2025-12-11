import { z } from "zod";

export const configureWebhookRequest = z.object({
  formId: z
    .number()
    .int("Form ID must be an integer")
    .positive("Form ID must be a positive number"),

  webhookUrl: z
    .string()
    .url("Webhook URL must be a valid URL")
    .refine((url) => url.startsWith("https://"), {
      message: "Webhook URL must use HTTPS for security",
    }),

  webhookEnabled: z.boolean().default(true),

  webhookHeaders: z.record(z.string(), z.string()).optional().default({}),

  webhookSecret: z.string().optional(),
});

export type ConfigureWebhookRequest = z.infer<typeof configureWebhookRequest>;

export const configureWebhookResponse = z.object({
  message: z.string(),
  success: z.boolean(),
});

export type ConfigureWebhookResponse = z.infer<typeof configureWebhookResponse>;

// Webhook payload (for actual form submissions)
export const webhookPayload = z.object({
  formId: z.number(),
  submissionId: z.number(),
  formName: z.string(),
  data: z.record(z.string(), z.any()),
  submittedAt: z.string(),
  metadata: z.object({
    sessionId: z.string(),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
  }),
  sessionInteractions: z.any().optional(),
  visitedPages: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        order: z.number(),
      })
    )
    .optional(),
});

export type WebhookPayload = z.infer<typeof webhookPayload>;