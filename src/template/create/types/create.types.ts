import { z } from "zod";

export const createTemplateRequest = z.object({
  name: z
    .string({
      message: "Template name must be a string",
    })
    .trim()
    .min(1, "Template name cannot be empty")
    .max(255, "Template name must be less than 255 characters"),
  description: z
    .string({
      message: "Template description must be a string",
    })
    .trim()
    .max(1000, "Template description must be less than 1000 characters")
    .optional(),
  categoryId: z
    .number({
      message: "Category ID must be a number",
    })
    .positive("Category ID must be a positive number"),
  funnelId: z
    .number({
      message: "Funnel ID must be a number",
    })
    .positive("Funnel ID must be a positive number"),
  tags: z
    .array(z.string().trim().min(1, "Tag cannot be empty"))
    .max(10, "Cannot have more than 10 tags")
    .default([]),
  isPublic: z
    .boolean({
      message: "isPublic must be a boolean",
    })
    .default(true),
});

export type CreateTemplateRequest = z.infer<typeof createTemplateRequest>;

export const createTemplateResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
});

export type CreateTemplateResponse = z.infer<typeof createTemplateResponse>;
