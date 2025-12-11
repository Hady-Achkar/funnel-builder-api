import { z } from "zod";

export const replaceTemplateFromFunnelRequestSchema = z.object({
  workspaceSlug: z
    .string({ message: "Workspace slug is required" })
    .trim()
    .min(1, { message: "Workspace slug cannot be empty" }),
  funnelSlug: z
    .string({ message: "Funnel slug is required" })
    .trim()
    .min(1, { message: "Funnel slug cannot be empty" }),
});

export const replaceTemplateFromFunnelResponseSchema = z.object({
  message: z.string(),
  templateId: z.number().int().positive(),
  templateSlug: z.string(),
});

export type ReplaceTemplateFromFunnelRequest = z.infer<
  typeof replaceTemplateFromFunnelRequestSchema
>;

export type ReplaceTemplateFromFunnelResponse = z.infer<
  typeof replaceTemplateFromFunnelResponseSchema
>;
