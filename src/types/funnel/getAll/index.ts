import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const getAllFunnelsParams = z.object({
  workspaceSlug: z.string().min(1, "Workspace slug is required"),
});

export const getAllFunnelsRequest = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  status: z.enum($Enums.FunnelStatus).optional(),
  search: z.string().min(1).optional(),
  createdBy: z.number().int().positive().optional(),
});

export const getAllFunnelsResponse = z.object({
  message: z.string(),
  funnels: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      status: z.enum($Enums.FunnelStatus),
      workspaceId: z.number(),
      createdBy: z.number(),
      createdAt: z.union([z.date(), z.string()]),
      updatedAt: z.union([z.date(), z.string()]),
      settings: z
        .object({
          id: z.number(),
          funnelId: z.number(),
          defaultSeoTitle: z.string().nullable(),
          defaultSeoDescription: z.string().nullable(),
          defaultSeoKeywords: z.string().nullable(),
          favicon: z.string().nullable(),
          ogImage: z.string().nullable(),
          googleAnalyticsId: z.string().nullable(),
          facebookPixelId: z.string().nullable(),
          customTrackingScripts: z.array(z.string()).nullable(),
          enableCookieConsent: z.boolean(),
          cookieConsentText: z.string().nullable(),
          privacyPolicyUrl: z.string().nullable(),
          termsOfServiceUrl: z.string().nullable(),
          language: z.string().nullable(),
          timezone: z.string().nullable(),
          dateFormat: z.string().nullable(),
          isPasswordProtected: z.boolean(),
          passwordHash: z.string().nullable(),
          createdAt: z.union([z.date(), z.string()]),
          updatedAt: z.union([z.date(), z.string()]),
        })
        .nullable(),
    })
  ),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export type GetAllFunnelsParams = z.infer<typeof getAllFunnelsParams>;
export type GetAllFunnelsRequest = z.infer<typeof getAllFunnelsRequest>;
export type GetAllFunnelsResponse = z.infer<typeof getAllFunnelsResponse>;
