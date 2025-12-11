import { z } from "zod";

export const uploadImagesRequest = z.object({
  folderId: z
    .string({
      message: "Folder ID must be provided",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Folder ID must be a positive number",
    }),
});

export type UploadImagesRequest = z.infer<typeof uploadImagesRequest>;

export const uploadImagesResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
});

export type UploadImagesResponse = z.infer<typeof uploadImagesResponse>;