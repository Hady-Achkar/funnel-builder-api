import { z } from "zod";

export const updateThemeParams = z.object({
  id: z
    .union([z.string(), z.number()])
    .transform((val) => typeof val === 'string' ? parseInt(val, 10) : val)
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Theme ID must be a positive number",
    }),
});

export type UpdateThemeParams = z.infer<typeof updateThemeParams>;

// Input type for controller (before validation)
export type UpdateThemeParamsInput = {
  id: string | number;
};

export const updateThemeRequest = z.object({
  name: z.string().min(1, "Theme name cannot be empty").max(100, "Theme name must be less than 100 characters").optional(),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Background color must be a valid hex color").optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Text color must be a valid hex color").optional(),
  buttonColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Button color must be a valid hex color").optional(),
  buttonTextColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Button text color must be a valid hex color").optional(),
  borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Border color must be a valid hex color").optional(),
  optionColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Option color must be a valid hex color").optional(),
  fontFamily: z.string().min(1, "Font family cannot be empty").max(100, "Font family must be less than 100 characters").optional(),
  borderRadius: z.enum(["NONE", "SOFT", "ROUNDED"], { message: "Border radius must be NONE, SOFT, or ROUNDED" }).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

export type UpdateThemeRequest = z.infer<typeof updateThemeRequest>;

export const updateThemeResponse = z.object({
  message: z.string(),
});

export type UpdateThemeResponse = z.infer<typeof updateThemeResponse>;