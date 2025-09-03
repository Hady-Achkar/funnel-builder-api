import { z } from "zod";
import { PageType } from "../../../generated/prisma-client";

export const createPageRequest = z.object({
  name: z
    .string({
      message: "Page name must be a string",
    })
    .trim()
    .max(255, "Page name must be less than 255 characters")
    .optional(),
  content: z
    .string({
      message: "Page content must be a string",
    })
    .default("")
    .optional(),
  type: z
    .nativeEnum(PageType)
    .default(PageType.PAGE)
    .optional(),
  funnelId: z.coerce
    .number({
      message: "Funnel ID must be a number",
    })
    .positive("Funnel ID must be a positive number"),
});

export type CreatePageRequest = z.infer<typeof createPageRequest>;

export const createPageResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
  pageId: z.number({
    message: "Page ID must be a number",
  }),
});

export type CreatePageResponse = z.infer<typeof createPageResponse>;