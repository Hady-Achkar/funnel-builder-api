import { z } from "zod";

export const deleteImageFolderRequest = z.object({
  id: z
    .string({
      message: "Folder ID is required",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Folder ID must be a valid positive number",
    }),
});

export type DeleteImageFolderRequest = z.infer<typeof deleteImageFolderRequest>;

export const deleteImageFolderResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
});

export type DeleteImageFolderResponse = z.infer<
  typeof deleteImageFolderResponse
>;