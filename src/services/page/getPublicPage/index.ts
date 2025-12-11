import {
  GetPublicPageResponse,
  getPublicPageRequest,
  getPublicPageResponse,
} from "../../../types/page/getPublicPage";
import { getPrisma } from "../../../lib/prisma";
import { BadRequestError } from "../../../errors";
import { ZodError } from "zod";

export const getPublicPage = async (
  requestBody: Record<string, unknown>
): Promise<GetPublicPageResponse> => {
  try {
    // Parse and validate request data
    const validatedRequest = getPublicPageRequest.parse(requestBody);

    const prisma = getPrisma();

    // Find the funnel by slug, ensure it's LIVE, and verify domain association
    const funnel = await prisma.funnel.findFirst({
      where: {
        slug: validatedRequest.funnelSlug,
        status: 'LIVE',
        OR: [
          {
            // Workspace owns the domain
            workspace: {
              domains: {
                some: {
                  hostname: validatedRequest.hostname
                }
              }
            }
          },
          {
            // Funnel is connected to the domain
            domainConnections: {
              some: {
                domain: {
                  hostname: validatedRequest.hostname
                },
                isActive: true
              }
            }
          }
        ]
      },
      include: {
        pages: {
          where: {
            linkingId: validatedRequest.linkingId,
          },
          select: {
            id: true,
            name: true,
            content: true,
            order: true,
            type: true,
            linkingId: true,
            seoTitle: true,
            seoDescription: true,
            seoKeywords: true,
            funnelId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!funnel) {
      throw new BadRequestError("Page not found or not publicly accessible");
    }

    if (funnel.pages.length === 0) {
      throw new BadRequestError("Page not found or not publicly accessible");
    }

    const page = funnel.pages[0];

    return getPublicPageResponse.parse(page);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message || "Invalid data provided";
      throw new BadRequestError(message);
    }
    throw error;
  }
};