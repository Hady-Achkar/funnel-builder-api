import { z } from "zod";

// No request schema needed - just userId and file
export const uploadSingleImageResponse = z.object({
  message: z.string({
    message: "Message must be a string",
  }),
  url: z.string({
    message: "URL must be a string",
  }),
});

export type UploadSingleImageResponse = z.infer<
  typeof uploadSingleImageResponse
>;
