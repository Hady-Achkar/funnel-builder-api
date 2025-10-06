import { z } from "zod";
import { ThemeType, BorderRadius } from "../../../generated/prisma-client";

// Response is an array of themes directly, no wrapper
export const globalThemeSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.nativeEnum(ThemeType),
  funnelId: z.number().nullable(),
  backgroundColor: z.string(),
  textColor: z.string(),
  buttonColor: z.string(),
  buttonTextColor: z.string(),
  borderColor: z.string(),
  optionColor: z.string(),
  fontFamily: z.string(),
  borderRadius: z.nativeEnum(BorderRadius),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getGlobalThemesResponse = z.array(globalThemeSchema);

export type GlobalTheme = z.infer<typeof globalThemeSchema>;
export type GetGlobalThemesResponse = z.infer<typeof getGlobalThemesResponse>;
