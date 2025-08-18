import { z } from "zod";

export const createFunnelFromTemplateRequest = z.object({
  templateId: z
    .union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Template ID must be a positive number",
    }),
  name: z
    .string({ message: "Funnel name is required" })
    .min(1, { message: "Funnel name cannot be empty" }),
});

export type CreateFunnelFromTemplateRequest = z.infer<typeof createFunnelFromTemplateRequest>;

export const createFunnelFromTemplateResponse = z.object({
  message: z.string(),
});

export type CreateFunnelFromTemplateResponse = z.infer<typeof createFunnelFromTemplateResponse>;