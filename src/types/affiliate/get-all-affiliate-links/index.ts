import { z } from "zod";
import { UserPlan } from "../../../generated/prisma-client";

// Request Schema
export const getAllAffiliateLinksRequestSchema = z.object({
  // Pagination
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().int().positive().max(100)),

  // Filters
  startDate: z
    .union([z.string(), z.date()])
    .transform((val) => {
      if (typeof val === "string") {
        const date = new Date(val);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
      val.setUTCHours(0, 0, 0, 0);
      return val;
    })
    .optional(),
  endDate: z
    .union([z.string(), z.date()])
    .transform((val) => {
      if (typeof val === "string") {
        const date = new Date(val);
        date.setUTCHours(23, 59, 59, 999);
        return date;
      }
      val.setUTCHours(23, 59, 59, 999);
      return val;
    })
    .optional(),

  // Search
  search: z.string().optional(),

  // Sorting
  sortBy: z
    .enum(["createdAt", "clickCount", "totalEarnings", "name"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Subscribed User Schema
export const subscribedUserSchema = z.object({
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  plan: z.nativeEnum(UserPlan),
  avatar: z.string().nullable(),
  createdAt: z.date(),
});

// Affiliate Link Detail Schema
export const affiliateLinkDetailSchema = z.object({
  name: z.string(),
  workspaceName: z.string(),
  clickCount: z.number(),
  totalEarnings: z.number(),
  cvr: z.number(), // Conversion Rate: (subscribedUsers / clickCount) * 100
  url: z.string(),
  createdAt: z.date(),
  subscribedUsers: z.array(subscribedUserSchema),
});

// Pagination Schema
export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

// Filters Schema
export const filtersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
});

// Response Schema
export const getAllAffiliateLinksResponseSchema = z.object({
  affiliateLinks: z.array(affiliateLinkDetailSchema),
  pagination: paginationSchema,
  filters: filtersSchema,
});

// Export inferred types
export type GetAllAffiliateLinksRequest = z.infer<
  typeof getAllAffiliateLinksRequestSchema
>;
export type SubscribedUser = z.infer<typeof subscribedUserSchema>;
export type AffiliateLinkDetail = z.infer<typeof affiliateLinkDetailSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type Filters = z.infer<typeof filtersSchema>;
export type GetAllAffiliateLinksResponse = z.infer<
  typeof getAllAffiliateLinksResponseSchema
>;

// For backward compatibility
export const getAllAffiliateLinksRequest = getAllAffiliateLinksRequestSchema;
export const getAllAffiliateLinksResponse = getAllAffiliateLinksResponseSchema;

// Legacy exports (keeping for gradual migration)
export const getAllAffiliateLinksQuery = getAllAffiliateLinksRequestSchema;
export type GetAllAffiliateLinksQuery = GetAllAffiliateLinksRequest;
