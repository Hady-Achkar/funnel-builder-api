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
  categoryId: z.coerce
    .number({
      message: "Category ID must be a number",
    })
    .positive("Category ID must be a positive number"),
  funnelId: z.coerce
    .number({
      message: "Funnel ID must be a number",
    })
    .positive("Funnel ID must be a positive number"),
  tags: z
    .union([
      z.string().transform((str) => {
        try {
          const parsed = JSON.parse(str);
          return Array.isArray(parsed) ? parsed : [str];
        } catch {
          return str.trim() ? [str] : [];
        }
      }),
      z.array(z.string().trim().min(1, "Tag cannot be empty")),
    ])
    .transform((val) => (Array.isArray(val) ? val : []))
    .pipe(z.array(z.string()).max(10, "Cannot have more than 10 tags"))
    .default([])
    .optional(),
  isPublic: z
    .union([z.boolean(), z.string().transform((val) => val === "true")])
    .default(true)
    .optional(),
  isActive: z
    .union([z.boolean(), z.string().transform((val) => val === "true")])
    .default(true)
    .optional(),
});

export type CreateTemplateRequest = z.infer<typeof createTemplateRequest>;

export const createTemplateResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
});

export type CreateTemplateResponse = z.infer<typeof createTemplateResponse>;
