import { z } from "zod";

export const deleteTemplateRequest = z.object({
  id: z
    .number({
      message: "Template ID must be a number",
    })
    .positive("Template ID must be a positive number"),
});

export type DeleteTemplateRequest = z.infer<typeof deleteTemplateRequest>;

export const deleteTemplateResponse = z.object({
  message: z.string({
    message: "Response message must be a string",
  }),
  deletedTemplateId: z.number(),
});

export type DeleteTemplateResponse = z.infer<typeof deleteTemplateResponse>;