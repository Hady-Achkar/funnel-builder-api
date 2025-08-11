import { z } from "zod";
import { $Enums } from "../../generated/prisma-client";

export const UpdateThemeParamsSchema = z.object({
  themeId: z
    .number({ message: "Theme ID must be a number" })
    .int({ message: "Theme ID must be an integer" })
    .positive({ message: "Theme ID must be positive" }),
});

export const UpdateThemeBodySchema = z.object({
  name: z
    .string({ message: "Theme name must be a string" })
    .min(1, { message: "Theme name cannot be empty" })
    .max(100, { message: "Theme name cannot exceed 100 characters" })
    .optional(),
  backgroundColor: z
    .string({ message: "Background color must be a string" })
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
      message: "Background color must be a valid hex color",
    })
    .optional(),
  textColor: z
    .string({ message: "Text color must be a string" })
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
      message: "Text color must be a valid hex color",
    })
    .optional(),
  buttonColor: z
    .string({ message: "Button color must be a string" })
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
      message: "Button color must be a valid hex color",
    })
    .optional(),
  buttonTextColor: z
    .string({ message: "Button text color must be a string" })
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
      message: "Button text color must be a valid hex color",
    })
    .optional(),
  borderColor: z
    .string({ message: "Border color must be a string" })
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
      message: "Border color must be a valid hex color",
    })
    .optional(),
  optionColor: z
    .string({ message: "Option color must be a string" })
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
      message: "Option color must be a valid hex color",
    })
    .optional(),
  fontFamily: z
    .string({ message: "Font family must be a string" })
    .min(1, { message: "Font family cannot be empty" })
    .max(100, { message: "Font family cannot exceed 100 characters" })
    .optional(),
  borderRadius: z
    .nativeEnum($Enums.BorderRadius, { message: "Invalid border radius" })
    .optional(),
});

export const UpdateThemeResponseSchema = z.object({
  message: z
    .string({ message: "Message is required" })
    .min(1, "Message cannot be empty"),
});

export type UpdateThemeParams = z.infer<typeof UpdateThemeParamsSchema>;
export type UpdateThemeBody = z.infer<typeof UpdateThemeBodySchema>;
export type UpdateThemeResponse = z.infer<typeof UpdateThemeResponseSchema>;

export type UpdateThemeData = UpdateThemeBody;
