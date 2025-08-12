import { z } from "zod";

export const createImageFolderRequest = z.object({
  name: z
    .string({
      message: "Folder name must be a string",
    })
    .trim()
    .min(1, "Folder name cannot be empty")
    .max(100, "Folder name must be less than 100 characters"),
});

export type CreateImageFolderRequest = z.infer<typeof createImageFolderRequest>;

export const createImageFolderResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
});

export type CreateImageFolderResponse = z.infer<
  typeof createImageFolderResponse
>;
