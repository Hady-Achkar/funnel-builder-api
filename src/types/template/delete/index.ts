import { z } from "zod";

export const deleteTemplateParams = z.object({
  templateSlug: z
    .string({ message: "Template slug is required" })
    .trim()
    .min(1, { message: "Template slug cannot be empty" }),
});

export type DeleteTemplateParams = z.infer<typeof deleteTemplateParams>;

export interface DeleteTemplateRequest {
  templateSlug: string;
  isAdmin: boolean;
}

export const deleteTemplateResponse = z.object({
  message: z.string(),
  deletedTemplateSlug: z.string(),
});

export type DeleteTemplateResponse = z.infer<typeof deleteTemplateResponse>;
