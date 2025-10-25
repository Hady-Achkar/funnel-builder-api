import { getPrisma } from "../../../lib/prisma";
import { NotFoundError, ForbiddenError } from "../../../errors/http-errors";
import {
  DomainStatus,
  SslStatus,
  FunnelStatus,
} from "../../../generated/prisma-client";
import {
  GetPublicSiteRequest,
  GetPublicSiteResponse,
} from "../../../types/site/get-public-site";
import { formatSiteResponse } from "./utils/format-site-response";

export class GetPublicSiteService {
  static async getPublicSite(
    requestData: GetPublicSiteRequest
  ): Promise<GetPublicSiteResponse> {
    try {
      const prisma = getPrisma();
      const { hostname } = requestData;

      // Step 1: Look up domain by hostname
      const domain = await prisma.domain.findUnique({
        where: { hostname },
      });

      if (!domain) {
        throw new NotFoundError("Domain not found");
      }

      // Step 2: Validate domain status
      if (domain.status !== DomainStatus.ACTIVE) {
        throw new NotFoundError("Domain is not active");
      }

      // if (domain.sslStatus !== SslStatus.ACTIVE) {
      //   throw new NotFoundError("Domain SSL certificate is not active");
      // }

      // Step 3: Find connected site/funnel
      const domainFunnelConnection = await prisma.funnelDomain.findFirst({
        where: {
          domainId: domain.id,
          isActive: true,
        },
      });

      if (!domainFunnelConnection) {
        throw new NotFoundError("No site is connected to this domain");
      }

      // Step 4: Fetch site/funnel with related data
      const funnel = await prisma.funnel.findUnique({
        where: { id: domainFunnelConnection.funnelId },
        include: {
          pages: {
            orderBy: {
              order: "asc",
            },
          },
          settings: true,
          customTheme: true,
        },
      });

      if (!funnel) {
        throw new NotFoundError("Site not found");
      }

      // Step 5: Validate site status
      if (funnel.status === FunnelStatus.DRAFT) {
        throw new ForbiddenError("Site is not published");
      }

      if (funnel.status === FunnelStatus.ARCHIVED) {
        throw new ForbiddenError("Site has been archived");
      }

      // Step 6: Format and return response
      return formatSiteResponse(funnel);
    } catch (error) {
      throw error;
    }
  }
}
