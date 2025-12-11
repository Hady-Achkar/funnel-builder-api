import { z } from "zod";

export const deleteImageRequest = z.object({
  imageId: z
    .string({
      message: "Image ID must be provided",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Image ID must be a positive number",
    }),
});

export type DeleteImageRequest = z.infer<typeof deleteImageRequest>;

export const deleteImageResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
});

export type DeleteImageResponse = z.infer<typeof deleteImageResponse>;