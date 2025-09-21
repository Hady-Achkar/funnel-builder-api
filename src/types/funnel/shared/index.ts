import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

// Reusable cache type for funnel with pages (without content)
export const cachedFunnelWithPages = z.object({
  id: z.number(),
  name: z.string(),
  status: z.enum($Enums.FunnelStatus),
  workspaceId: z.number(),
  createdBy: z.number(),
  themeId: z.number(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  theme: z.object({
    id: z.number(),
    name: z.string(),
    backgroundColor: z.string(),
    textColor: z.string(),
    buttonColor: z.string(),
    buttonTextColor: z.string(),
    borderColor: z.string(),
    optionColor: z.string(),
    fontFamily: z.string(),
    borderRadius: z.enum($Enums.BorderRadius),
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
  }),
  pages: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      order: z.number(),
      linkingId: z.string(),
      seoTitle: z.string().nullable(),
      seoDescription: z.string().nullable(),
      seoKeywords: z.string().nullable(),
    })
  ),
});

export type CachedFunnelWithPages = z.infer<typeof cachedFunnelWithPages>;
