import { z } from "zod";

export const moveImageParams = z.object({
  imageId: z
    .string({
      message: "Image ID must be provided",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Image ID must be a positive number",
    }),
});

export type MoveImageParams = z.infer<typeof moveImageParams>;

export const moveImageBody = z.object({
  targetFolderId: z
    .union([z.string(), z.number()], {
      message: "Target Folder ID must be provided",
    })
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      return num;
    })
    .refine((val) => !isNaN(val) && Number.isInteger(val) && val > 0, {
      message: "Target Folder ID must be a positive integer",
    }),
});

export type MoveImageBody = z.infer<typeof moveImageBody>;

export const moveImageResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
});

export type MoveImageResponse = z.infer<typeof moveImageResponse>;