import { z } from "zod";

export const LinkSchema = z.object({
  enabled: z.boolean(),
  href: z.string(),
  target: z.enum(["_self", "_blank"]),
  type: z.enum(["internal", "external"]),
});

export const FormatSchema = z.object({
  bold: z.boolean(),
  italic: z.boolean(),
  underline: z.boolean(),
  strikethrough: z.boolean(),
});

export const BadgeSchema = z.object({
  enabled: z.boolean(),
  label: z.string(),
  textColor: z.string(),
  backgroundColor: z.string(),
});

export const IconContentSchema = z.object({
  type: z.enum(["icon", "emoji"]),
  value: z.string(),
});

export const SelectedCountrySchema = z.object({
  code: z.string(),
  name: z.string(),
  icon: z.string(),
  dialCode: z.string(),
});

export type ElementSize = "sm" | "md" | "lg" | "xl";

export type TextAlign = "left" | "center" | "right" | "justify";

export type BorderRadius = "NONE" | "SOFT" | "ROUNDED";

export interface ElementDefinition {
  type: string;
  name: string;
  category:
    | "Essentials"
    | "Visuals & Media"
    | "Surveys & Quizzes"
    | "Informative"
    | "Get Responses";
  description: string;
  schema: Record<string, any>;
  zodSchema: z.ZodSchema;
  examples: Array<any>;
  aiInstructions: string;
  createDefault: (overrides?: Partial<any>) => any;
}

export type Link = z.infer<typeof LinkSchema>;
export type Format = z.infer<typeof FormatSchema>;
export type Badge = z.infer<typeof BadgeSchema>;
export type IconContent = z.infer<typeof IconContentSchema>;
export type SelectedCountry = z.infer<typeof SelectedCountrySchema>;
