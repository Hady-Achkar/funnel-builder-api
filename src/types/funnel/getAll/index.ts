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
  status: z.nativeEnum($Enums.FunnelStatus).optional(),
});

export const getAllFunnelsResponse = z.object({
  message: z.string(),
  funnels: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      status: z.nativeEnum($Enums.FunnelStatus),
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
        borderRadius: z.nativeEnum($Enums.BorderRadius),
        createdAt: z.union([z.date(), z.string()]),
        updatedAt: z.union([z.date(), z.string()]),
      }),
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