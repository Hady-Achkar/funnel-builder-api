import { z } from "zod";

export const setActiveThemeParams = z.object({
  funnelId: z.number().int().positive(),
});

export const setActiveThemeRequest = z.object({
  themeId: z.number().int().positive({ message: "Theme ID must be a positive number" }),
});

export const setActiveThemeResponse = z.object({
  message: z.string(),
});

export type SetActiveThemeParams = z.infer<typeof setActiveThemeParams>;
export type SetActiveThemeRequest = z.infer<typeof setActiveThemeRequest>;
export type SetActiveThemeResponse = z.infer<typeof setActiveThemeResponse>;
