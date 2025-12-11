import { getPrisma } from "../../../lib/prisma";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";
import { calculatePagination, getPaginationOffset } from "../../../utils/pagination";
import { NotFoundError, BadRequestError } from "../../../errors/http-errors";
import { ZodError } from "zod";
import {
  GetAllDomainsResponse,
  GetAllDomainsRequestSchema,
  GetAllDomainsResponseSchema,
  DomainSummary,
} from "../../../types/domain/get-all-domains";
import {
  buildDomainFilters,
  buildDomainSorting,
} from "./utils/build-filters";

export class GetAllDomainsService {
  static async getAllDomains(
    userId: number,
    requestData: unknown
  ): Promise<GetAllDomainsResponse> {
    try {
      const validatedData = GetAllDomainsRequestSchema.parse(requestData);
      const { workspaceSlug, page, limit, filters, search, sortBy, sortOrder } = validatedData;

      // Get workspace by slug
      const workspace = await getPrisma().workspace.findUnique({
        where: { slug: workspaceSlug },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      await PermissionManager.requirePermission({
        userId,
        workspaceId: workspace.id,
        action: PermissionAction.VIEW_DOMAINS,
      });

      const whereClause = {
        workspaceId: workspace.id,
        ...buildDomainFilters(filters),
        ...(search && {
          hostname: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }),
      };

      const orderBy = buildDomainSorting(sortBy, sortOrder);

      const [domains, total] = await Promise.all([
        getPrisma().domain.findMany({
          where: whereClause,
          select: {
            id: true,
            hostname: true,
            type: true,
            status: true,
            workspaceId: true,
            createdAt: true,
          },
          orderBy,
          skip: getPaginationOffset(page, limit),
          take: limit,
        }),
        getPrisma().domain.count({
          where: whereClause,
        }),
      ]);

      const domainSummaries: DomainSummary[] = domains.map((domain) => ({
        id: domain.id,
        hostname: domain.hostname,
        type: domain.type,
        status: domain.status,
        workspaceId: domain.workspaceId,
        createdAt: domain.createdAt,
      }));

      const pagination = calculatePagination(page, limit, total);

      const response: GetAllDomainsResponse = {
        domains: domainSummaries,
        pagination,
        filters: filters || {},
      };

      return GetAllDomainsResponseSchema.parse(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        throw new BadRequestError(
          error.issues[0]?.message || "Invalid request data"
        );
      }
      throw error;
    }
  }
}