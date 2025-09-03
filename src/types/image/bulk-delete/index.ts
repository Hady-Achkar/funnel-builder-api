import { z } from "zod";

export const bulkDeleteImagesRequest = z.object({
  imageIds: z
    .array(z.number({
      message: "Each image ID must be a number",
    }).positive("Each image ID must be a positive number"))
    .min(1, "At least one image ID is required")
    .max(50, "Cannot delete more than 50 images at once")
    .refine((ids) => {
      const uniqueIds = new Set(ids);
      return uniqueIds.size === ids.length;
    }, {
      message: "Duplicate image IDs are not allowed",
    }),
});

export type BulkDeleteImagesRequest = z.infer<typeof bulkDeleteImagesRequest>;

export const bulkDeleteImagesResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
  deletedCount: z.number({
    message: "Deleted count must be a number",
  }),
  failedIds: z.array(z.number()).optional(),
  errors: z.array(z.string()).optional(),
});

export type BulkDeleteImagesResponse = z.infer<typeof bulkDeleteImagesResponse>;