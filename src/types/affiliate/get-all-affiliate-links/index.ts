import { z } from "zod";
import { $Enums } from "../../../generated/prisma-client";

export const getAllAffiliateLinksResponse = z.object({
  message: z.string(),
  affiliateLinks: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      token: z.string(),
      itemType: z.enum($Enums.UserPlan),
      clickCount: z.number(),
      totalAmount: z.number(),
      settings: z.record(z.string(), z.any()),
      url: z.string(),
      createdAt: z.date(),
      updatedAt: z.date(),
      funnel: z
        .object({
          id: z.number(),
          name: z.string(),
          slug: z.string(),
          status: z.string(),
        })
        .optional(),
      user: z.object({
        id: z.number(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
      }),
      _count: z.object({
        payments: z.number(),
        subscribedUsers: z.number(),
      }),
    })
  ),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});

export type GetAllAffiliateLinksResponse = z.infer<
  typeof getAllAffiliateLinksResponse
>;

export const getAllAffiliateLinksQuery = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  planType: z
    .enum($Enums.UserPlan, {
      message: `Plan type must be one of: ${Object.values($Enums.UserPlan).join(
        ", "
      )}`,
    })
    .optional(),
  sortBy: z
    .enum(["createdAt", "clickCount", "totalAmount", "name"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type GetAllAffiliateLinksQuery = z.infer<
  typeof getAllAffiliateLinksQuery
>;
