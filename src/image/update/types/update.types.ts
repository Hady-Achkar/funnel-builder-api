import { z } from "zod";

export const updateImageRequest = z.object({
  imageId: z
    .string({
      message: "Image ID must be provided",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Image ID must be a positive number",
    }),
});

export type UpdateImageRequest = z.infer<typeof updateImageRequest>;

export const updateImageFormData = z.object({
  name: z.string().optional(),
  altText: z.string().optional(),
});

export type UpdateImageFormData = z.infer<typeof updateImageFormData>;

export const updateImageResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
});

export type UpdateImageResponse = z.infer<typeof updateImageResponse>;