import { z } from "zod";

export const updateImageFolderParamsRequest = z.object({
  id: z
    .string({
      message: "Folder ID is required",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Folder ID must be a valid positive number",
    }),
});

export const updateImageFolderRequest = z.object({
  name: z
    .string({
      message: "Folder name must be a string",
    })
    .trim()
    .min(1, "Folder name cannot be empty")
    .max(100, "Folder name must be less than 100 characters"),
});

export type UpdateImageFolderRequest = z.infer<typeof updateImageFolderRequest>;

export const updateImageFolderResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
});

export type UpdateImageFolderParamsRequest = z.infer<
  typeof updateImageFolderParamsRequest
>;

export type UpdateImageFolderResponse = z.infer<
  typeof updateImageFolderResponse
>;
