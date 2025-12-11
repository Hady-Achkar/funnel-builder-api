import { z } from "zod";

export const uploadWorkspaceImageRequest = z.object({
  slug: z.string().min(1),
});

export type UploadWorkspaceImageRequest = z.infer<typeof uploadWorkspaceImageRequest>;

export const uploadWorkspaceImageResponse = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  image: z.string().nullable(),
});

export type UploadWorkspaceImageResponse = z.infer<typeof uploadWorkspaceImageResponse>;