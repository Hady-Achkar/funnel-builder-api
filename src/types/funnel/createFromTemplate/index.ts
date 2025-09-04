import { z } from "zod";

export const createFromTemplateParams = z.object({
  templateId: z.number().int().positive(),
});

export const createFromTemplateRequest = z.object({
  name: z.string().min(1, { message: "Funnel name cannot be empty" }),
  slug: z
    .string({ message: "Funnel slug must be a string" })
    .trim()
    .min(1, "Funnel slug cannot be empty")
    .max(100, "Funnel slug must be less than 100 characters")
    .optional(),
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
});

export const createFromTemplateResponse = z.object({
  message: z.string(),
  funnelId: z.number(),
});

export type CreateFromTemplateParams = z.infer<typeof createFromTemplateParams>;
export type CreateFromTemplateRequest = z.infer<
  typeof createFromTemplateRequest
>;
export type CreateFromTemplateResponse = z.infer<
  typeof createFromTemplateResponse
>;