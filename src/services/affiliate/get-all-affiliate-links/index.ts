import { getPrisma } from "../../../lib/prisma";
import {
  GetAllAffiliateLinksRequest,
  GetAllAffiliateLinksResponse,
  AffiliateLinkDetail,
  SubscribedUser,
} from "../../../types/affiliate/get-all-affiliate-links";
import { buildAffiliateLinkFilters } from "./utils/build-filters";
import { buildAffiliateLinkSorting } from "./utils/build-sorting";
import { calculatePagination } from "../../../utils/pagination";

export class GetAllAffiliateLinksService {
  static async getAllAffiliateLinks(
    userId: number,
    request: GetAllAffiliateLinksRequest
  ): Promise<GetAllAffiliateLinksResponse> {
    try {
      const prisma = getPrisma();

      // Build filters and sorting
      const where = buildAffiliateLinkFilters({
        userId,
        startDate: request.startDate,
        endDate: request.endDate,
        search: request.search,
      });

      const orderBy = buildAffiliateLinkSorting(request.sortBy, request.sortOrder);

      // Calculate pagination offset
      const skip = (request.page - 1) * request.limit;

      // Fetch affiliate links and total count in parallel
      const [affiliateLinks, totalLinks] = await Promise.all([
        prisma.affiliateLink.findMany({
          where,
          orderBy,
          skip,
          take: request.limit,
          include: {
            workspace: {
              select: {
                name: true,
              },
            },
            subscribedUsers: {
              where: {
                referralLinkUsedId: {
                  not: null,
                },
                plan: {
                  not: "NO_PLAN", // Exclude users who haven't paid
                },
              },
              select: {
                email: true,
                firstName: true,
                lastName: true,
                plan: true,
                avatar: true,
                createdAt: true,
              },
            },
          },
        }),
        prisma.affiliateLink.count({ where }),
      ]);

      // Calculate pagination metadata
      const pagination = calculatePagination(
        request.page,
        request.limit,
        totalLinks
      );

      // Format affiliate links
      const baseUrl = process.env.FRONTEND_URL;
      const formattedLinks: AffiliateLinkDetail[] = affiliateLinks.map((link) => {
        // Format subscribed users (already filtered to exclude NO_PLAN)
        const subscribedUsers: SubscribedUser[] = link.subscribedUsers.map((user) => ({
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          plan: user.plan,
          avatar: user.avatar,
          createdAt: user.createdAt,
        }));

        // Calculate CVR (Conversion Rate)
        // CVR = (number of subscribed users / clicks) * 100
        // If no clicks, CVR is 0
        const cvr = link.clickCount > 0
          ? (subscribedUsers.length / link.clickCount) * 100
          : 0;

        return {
          name: link.name,
          workspaceName: link.workspace.name,
          clickCount: link.clickCount,
          totalEarnings: link.totalAmount,
          cvr: Number(cvr.toFixed(2)), // Round to 2 decimal places
          url: `${baseUrl}/register?affiliate=${link.token}`,
          createdAt: link.createdAt,
          subscribedUsers,
        };
      });

      // Format filters for response
      const filters = {
        startDate: request.startDate?.toISOString(),
        endDate: request.endDate?.toISOString(),
        search: request.search,
      };

      return {
        affiliateLinks: formattedLinks,
        pagination,
        filters,
      };
    } catch (error) {
      throw error;
    }
  }
}
