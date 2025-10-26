import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const getFunnelParams = z.object({
  funnelId: z.number().int().positive(),
});

export const getFunnelResponse = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  status: z.nativeEnum($Enums.FunnelStatus),
  workspaceId: z.number(),
  createdBy: z.number(),
  activeThemeId: z.number().nullable(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  customTheme: z.object({
    id: z.number(),
    name: z.string(),
    backgroundColor: z.string(),
    textColor: z.string(),
    buttonColor: z.string(),
    buttonTextColor: z.string(),
    borderColor: z.string(),
    optionColor: z.string(),
    fontFamily: z.string(),
    borderRadius: z.nativeEnum($Enums.BorderRadius),
    type: z.nativeEnum($Enums.ThemeType),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
  }).nullable(),
  pages: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      type: z.nativeEnum($Enums.PageType),
      order: z.number(),
      linkingId: z.string().nullable(),
      seoTitle: z.string().nullable(),
      seoDescription: z.string().nullable(),
      seoKeywords: z.string().nullable(),
      visits: z.number().default(0),
    })
  ),
});

export type GetFunnelParams = z.infer<typeof getFunnelParams>;
export type GetFunnelResponse = z.infer<typeof getFunnelResponse>;
