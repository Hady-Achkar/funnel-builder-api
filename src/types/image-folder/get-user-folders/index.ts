import { z } from "zod";

export const getUserImageFoldersResponse = z.object({
  folders: z
    .array(
      z.object({
        id: z.number({
          message: "Folder ID must be a number",
        }),
        name: z.string({
          message: "Folder name must be a string",
        }),
        userId: z.number({
          message: "User ID must be a number",
        }),
        createdAt: z.date({
          message: "Created date must be a valid date",
        }),
        updatedAt: z.date({
          message: "Updated date must be a valid date",
        }),
        imageCount: z.number({
          message: "Image count must be a number",
        }),
      })
    )
    .min(0, "Folders array must be valid"),
});

export type GetUserImageFoldersResponse = z.infer<
  typeof getUserImageFoldersResponse
>;