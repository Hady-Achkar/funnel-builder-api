import { z } from "zod";

export const updateTemplateRequestBody = z.object({
  name: z
    .string({ message: "Name must be a string" })
    .min(1, { message: "Name cannot be empty" })
    .optional(),
  slug: z
    .string({ message: "Slug must be a string" })
    .min(1, { message: "Slug cannot be empty" })
    .optional(),
  description: z
    .string({ message: "Description must be a string" })
    .optional()
    .nullable(),
  categoryId: z
    .union([z.string(), z.number()], { message: "Category ID must be a string or number" })
    .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
    .refine((val) => !isNaN(val) && val > 0, { message: "Category ID must be a positive number" })
    .optional(),
  isActive: z
    .union([z.string(), z.boolean()], { message: "isActive must be a string or boolean" })
    .transform((val) => typeof val === 'string' ? val === 'true' : val)
    .optional(),
  isPublic: z
    .union([z.string(), z.boolean()], { message: "isPublic must be a string or boolean" })
    .transform((val) => typeof val === 'string' ? val === 'true' : val)
    .optional(),
  tags: z
    .union([
      z.string().transform((str) => {
        try {
          return JSON.parse(str);
        } catch {
          return str.split(',').map(tag => tag.trim());
        }
      }),
      z.array(z.string())
    ], { message: "Tags must be an array or comma-separated string" })
    .optional(),
  thumbnail: z
    .string({ message: "Thumbnail must be a string URL" })
    .min(1, { message: "Thumbnail URL cannot be empty" })
    .optional(),
  images: z
    .union([
      z.string().transform((str) => {
        try {
          const parsed = JSON.parse(str);
          return Array.isArray(parsed) ? parsed : [str];
        } catch {
          return [str];
        }
      }),
      z.array(z.string({ message: "Each image URL must be a string" }))
    ], { message: "Images must be an array or JSON string of URLs" })
    .optional(),
});

export type UpdateTemplateRequestBody = z.infer<typeof updateTemplateRequestBody>;

export const updateTemplateRequest = z.object({
  id: z
    .number({ message: "Template ID must be a number" })
    .int({ message: "Template ID must be an integer" })
    .positive({ message: "Template ID must be positive" }),
  ...updateTemplateRequestBody.shape
});

export type UpdateTemplateRequest = z.infer<typeof updateTemplateRequest>;

export const updateTemplateResponse = z.object({
  message: z.string(),
});

export type UpdateTemplateResponse = z.infer<typeof updateTemplateResponse>;