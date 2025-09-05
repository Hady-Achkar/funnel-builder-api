import { ZodError } from "zod";
import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors/http-errors";
import {
  getAllAffiliateLinksQuery,
  GetAllAffiliateLinksQuery,
  GetAllAffiliateLinksResponse,
} from "../../../types/affiliate/get-all-affiliate-links";

export class GetAllAffiliateLinksService {
  static async getAllAffiliateLinks(
    userId: number,
    queryData: Record<string, unknown>
  ): Promise<GetAllAffiliateLinksResponse> {
    try {
      // Validate query parameters
      const validatedQuery = getAllAffiliateLinksQuery.parse(queryData);
      const { page, limit, search, planType, sortBy, sortOrder } = validatedQuery;

      // Calculate offset for pagination
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {
        userId: userId,
      };

      if (search) {
        whereClause.name = {
          contains: search,
          mode: 'insensitive',
        };
      }

      if (planType) {
        whereClause.itemType = planType;
      }

      // Build order by clause
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // Get total count for pagination
      const total = await getPrisma().affiliateLink.count({
        where: whereClause,
      });

      // Get affiliate links with all related data
      const affiliateLinks = await getPrisma().affiliateLink.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              payments: true,
              subscribedUsers: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      });

      // Get funnel data from JWT tokens and construct affiliate URLs
      const baseUrl = process.env.FRONTEND_URL;
      const enrichedAffiliateLinks = await Promise.all(
        affiliateLinks.map(async (link) => {
          let funnelData = null;
          
          // Try to decode JWT token to get funnel info
          if (link.token) {
            try {
              const jwt = require('jsonwebtoken');
              const jwtSecret = process.env.JWT_SECRET;
              if (jwtSecret) {
                const decoded = jwt.verify(link.token, jwtSecret) as any;
                if (decoded.funnelId) {
                  const funnel = await getPrisma().funnel.findUnique({
                    where: { id: decoded.funnelId },
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                      status: true,
                    },
                  });
                  funnelData = funnel;
                }
              }
            } catch (error) {
              // JWT decode failed, continue without funnel data
            }
          }

          return {
            id: link.id,
            name: link.name,
            token: link.token,
            itemType: link.itemType,
            clickCount: link.clickCount,
            totalAmount: link.totalAmount,
            settings: link.settings as Record<string, any>,
            url: `${baseUrl}/affiliate?affiliate=${link.token}`,
            createdAt: link.createdAt,
            updatedAt: link.updatedAt,
            funnel: funnelData,
            user: link.user,
            _count: link._count,
          };
        })
      );

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);

      const response: GetAllAffiliateLinksResponse = {
        message: "Affiliate links retrieved successfully",
        affiliateLinks: enrichedAffiliateLinks,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      };

      return response;
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid query parameters";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}