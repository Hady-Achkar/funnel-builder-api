import { z } from "zod";

export const createFunnelFromTemplateRequestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Funnel name cannot be empty" })
    .max(255, { message: "Funnel name must be less than 255 characters" })
    .optional(),
  slug: z
    .string()
    .trim()
    .min(1, { message: "Slug cannot be empty" })
    .max(100, { message: "Slug must be less than 100 characters" })
    .optional(),
  workspaceSlug: z
    .string({ message: "Workspace slug is required" })
    .trim()
    .min(1, { message: "Workspace slug cannot be empty" }),
  templateSlug: z
    .string({ message: "Template slug is required" })
    .trim()
    .min(1, { message: "Template slug cannot be empty" }),
});

export const createFunnelFromTemplateResponseSchema = z.object({
  message: z.string(),
  funnelId: z.number().int().positive(),
  funnelSlug: z.string(),
});

export type CreateFunnelFromTemplateRequest = z.infer<
  typeof createFunnelFromTemplateRequestSchema
>;

export type CreateFunnelFromTemplateResponse = z.infer<
  typeof createFunnelFromTemplateResponseSchema
>;
