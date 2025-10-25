import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const createGlobalThemeRequest = z.object({
  name: z
    .string()
    .min(1, "Theme name cannot be empty")
    .max(100, "Theme name must be less than 100 characters"),

  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Background color must be a valid hex color"),

  textColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Text color must be a valid hex color"),

  buttonColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Button color must be a valid hex color"),

  buttonTextColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Button text color must be a valid hex color"),

  borderColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Border color must be a valid hex color"),

  optionColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Option color must be a valid hex color"),

  fontFamily: z
    .string()
    .min(1, "Font family cannot be empty")
    .max(100, "Font family must be less than 100 characters"),

  borderRadius: z.nativeEnum($Enums.BorderRadius, {
    message: "Border radius must be NONE, SOFT, or ROUNDED",
  }),
});

export type CreateGlobalThemeRequest = z.infer<typeof createGlobalThemeRequest>;

export const createGlobalThemeResponse = z.object({
  id: z.number(),
  name: z.string(),
  type: z.nativeEnum($Enums.ThemeType),
  funnelId: z.number().nullable(),
  backgroundColor: z.string(),
  textColor: z.string(),
  buttonColor: z.string(),
  buttonTextColor: z.string(),
  borderColor: z.string(),
  optionColor: z.string(),
  fontFamily: z.string(),
  borderRadius: z.nativeEnum($Enums.BorderRadius),
  createdAt: z.date(),
  updatedAt: z.date(),
  message: z.string(),
});

export type CreateGlobalThemeResponse = z.infer<typeof createGlobalThemeResponse>;
