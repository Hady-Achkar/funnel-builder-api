import { z } from "zod";

export const deletePageRequest = z.object({
  pageId: z.number().positive("Page ID must be a positive number"),
});

export const deletePageResponse = z.object({
  message: z.string(),
});

export type DeletePageRequest = z.infer<typeof deletePageRequest>;
export type DeletePageResponse = z.infer<typeof deletePageResponse>;