import { getPrisma } from "../../../lib/prisma";
import { NotFoundError, ForbiddenError } from "../../../errors/http-errors";
import { DomainStatus, FunnelStatus } from "../../../generated/prisma-client";
import {
  GetPublicSiteRequest,
  GetPublicSiteResponse,
} from "../../../types/site/get-public-site";
import { formatSiteResponse } from "./utils/format-site-response";
import { verifyFunnelAccessToken } from "../../../lib/jwt";
import jwt from "jsonwebtoken";

export class GetPublicSiteService {
  static async getPublicSite(
    requestData: GetPublicSiteRequest,
    cookies?: any
  ): Promise<GetPublicSiteResponse> {
    try {
      const prisma = getPrisma();
      const { hostname, funnelSlug } = requestData;

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

      // Step 3: Find the funnel by slug
      const funnel = await prisma.funnel.findFirst({
        where: { slug: funnelSlug },
        include: {
          pages: {
            select: {
              id: true,
              name: true,
              linkingId: true,
              order: true,
              type: true,
            },
            orderBy: {
              order: "asc",
            },
          },
          settings: true,
          activeTheme: true,
        },
      });

      if (!funnel) {
        throw new NotFoundError("Site not found");
      }

      // Step 4: Verify this funnel is connected to the domain
      const domainFunnelConnection = await prisma.funnelDomain.findFirst({
        where: {
          domainId: domain.id,
          funnelId: funnel.id,
          isActive: true,
        },
      });

      if (!domainFunnelConnection) {
        throw new NotFoundError("Site not found for this domain");
      }

      // Step 6: Validate site status
      if (funnel.status === FunnelStatus.DRAFT) {
        throw new ForbiddenError("Site is not published");
      }

      if (funnel.status === FunnelStatus.ARCHIVED) {
        throw new ForbiddenError("Site has been archived");
      }

      // Step 7: Check password protection and access token
      const requiresPassword = funnel.settings?.isPasswordProtected || false;
      let hasAccess = !requiresPassword; // If not password protected, user has access
      let tokenExpiry: number | null = null;

      if (requiresPassword && cookies) {
        const cookieName = `funnel_access_${funnelSlug}`;
        const token = cookies[cookieName];

        if (token) {
          const decoded = verifyFunnelAccessToken(token);
          if (
            decoded &&
            decoded.funnelSlug === funnelSlug &&
            decoded.funnelId === funnel.id &&
            decoded.hasAccess
          ) {
            hasAccess = true;
            // Extract token expiry from JWT
            try {
              const jwtPayload = jwt.decode(token) as any;
              if (jwtPayload && jwtPayload.exp) {
                tokenExpiry = jwtPayload.exp * 1000; // Convert to milliseconds
              }
            } catch (error) {
              // If decoding fails, leave tokenExpiry as null
            }
          }
        }
      }

      // Step 8: Format and return response with access control
      if (!hasAccess) {
        return {
          site: null,
          requiresPassword,
          hasAccess,
          tokenExpiry,
        };
      }

      const siteData = formatSiteResponse(funnel);
      return {
        ...siteData,
        requiresPassword,
        hasAccess,
        tokenExpiry,
      };
    } catch (error) {
      throw error;
    }
  }
}
