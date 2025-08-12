import { z } from "zod";

export const getImageFolderByIdRequest = z.object({
  id: z
    .string({
      message: "Folder ID is required",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Folder ID must be a valid positive number",
    }),
});

export const getImageFolderByIdResponse = z.object({
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
  images: z.array(
    z.object({
      id: z.number({
        message: "Image ID must be a number",
      }),
      name: z.string({
        message: "Image name must be a string",
      }),
      url: z.string({
        message: "Image URL must be a string",
      }),
      createdAt: z.date({
        message: "Image created date must be a valid date",
      }),
    })
  ),
});

export type GetImageFolderByIdRequest = z.infer<
  typeof getImageFolderByIdRequest
>;

export type GetImageFolderByIdResponse = z.infer<
  typeof getImageFolderByIdResponse
>;
