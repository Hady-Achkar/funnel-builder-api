import { getPrisma } from "../../../lib/prisma";
import { NotFoundError, BadRequestError } from "../../../errors/http-errors";
import { ZodError } from "zod";
import {
  GetAllDomainsResponse,
  GetAllDomainsRequestSchema,
  GetAllDomainsResponseSchema,
  DomainSummary,
} from "../../../types/domain/get-all-domains";
import {
  validateGetAllDomainsAccess,
  buildDomainFilters,
  buildDomainSorting,
  calculatePagination,
  getPaginationOffset,
} from "../../../helpers/domain/get-all-domains";

export class GetAllDomainsService {
  static async getAllDomains(
    userId: number,
    requestData: unknown
  ): Promise<GetAllDomainsResponse> {
    try {
      const validatedData = GetAllDomainsRequestSchema.parse(requestData);
      const { workspaceSlug, page, limit, filters, sortBy, sortOrder } = validatedData;

      // Get workspace by slug
      const workspace = await getPrisma().workspace.findUnique({
        where: { slug: workspaceSlug },
      });

      if (!workspace) {
        throw new NotFoundError("Workspace not found");
      }

      await validateGetAllDomainsAccess(userId, workspace.id);

      const whereClause = {
        workspaceId: workspace.id,
        ...buildDomainFilters(filters),
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