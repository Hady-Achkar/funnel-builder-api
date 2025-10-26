import {
  DomainType,
  DomainStatus,
  SslStatus,
} from "../../../generated/prisma-client";
import { getPrisma } from "../../../lib/prisma";
import { validateSubdomainName } from "./utils/subdomain-validation";
import {
  getAzureFrontDoorConfig,
  sanitizeHostnameForAzure,
} from "../../../utils/domain-utils/azure-frontdoor-api";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";
import { WorkspaceSubdomainAllocations } from "../../../utils/allocations/workspace-subdomain-allocations";
import {
  CreateSubdomainResponse,
  CreateSubdomainRequestSchema,
  CreateSubdomainResponseSchema,
} from "../../../types/domain/create-subdomain";
import { BadRequestError } from "../../../errors/http-errors";
import { ZodError } from "zod";

export class CreateSubdomainService {
  static async create(
    userId: number,
    requestData: unknown
  ): Promise<CreateSubdomainResponse> {
    try {
      const validatedData = CreateSubdomainRequestSchema.parse(requestData);
      const { subdomain, workspaceSlug } = validatedData;

      const workspace = await getPrisma().workspace.findUnique({
        where: { slug: workspaceSlug },
        include: {
          addOns: {
            where: {
              OR: [
                { status: "ACTIVE" },
                {
                  status: "CANCELLED",
                  endDate: { gt: new Date() },
                },
              ],
            },
            select: {
              type: true,
              quantity: true,
              status: true,
              endDate: true,
            },
          },
        },
      });

      if (!workspace) {
        throw new BadRequestError("Workspace not found");
      }

      await PermissionManager.requirePermission({
        userId,
        workspaceId: workspace.id,
        action: PermissionAction.CREATE_SUBDOMAIN,
      });

      const currentSubdomainCount = await getPrisma().domain.count({
        where: {
          workspaceId: workspace.id,
          type: DomainType.SUBDOMAIN,
        },
      });

      const canCreate = WorkspaceSubdomainAllocations.canCreateSubdomain(
        currentSubdomainCount,
        {
          workspacePlanType: workspace.planType,
          addOns: workspace.addOns,
        }
      );

      if (!canCreate) {
        const summary = WorkspaceSubdomainAllocations.getAllocationSummary(
          currentSubdomainCount,
          {
            workspacePlanType: workspace.planType,
            addOns: workspace.addOns,
          }
        );

        throw new BadRequestError(
          `This workspace has reached its maximum limit of ${summary.totalAllocation} subdomain(s). You are currently using ${summary.currentUsage} subdomain(s).`
        );
      }

      const validatedSubdomain = validateSubdomainName(subdomain);

      // Build full hostname for subdomain on digitalsite.io
      const subdomainBase = process.env.WORKSPACE_DOMAIN || "digitalsite.io";
      const fullHostname = `${validatedSubdomain}.${subdomainBase}`;

      const existingDomain = await getPrisma().domain.findUnique({
        where: { hostname: fullHostname },
      });

      if (existingDomain) {
        throw new BadRequestError(
          "This subdomain is already taken. Please choose another one."
        );
      }

      const azureConfig = getAzureFrontDoorConfig();
      const azureCustomDomainName = sanitizeHostnameForAzure(fullHostname);

      // For subdomains under *.digitalsite.io, we rely on the wildcard certificate
      // No need to create individual custom domains in Azure - the wildcard covers them
      // Just create the database record
      const newDomain = await getPrisma().domain.create({
        data: {
          hostname: fullHostname,
          type: DomainType.SUBDOMAIN,
          status: DomainStatus.ACTIVE, // Immediately active due to wildcard
          sslStatus: SslStatus.ACTIVE, // SSL covered by wildcard certificate
          workspaceId: workspace.id,
          createdBy: userId,
          azureCustomDomainName: azureCustomDomainName,
          azureDomainStatus: "Approved", // Wildcard domain is pre-approved
          azureCertStatus: "ManagedCertificate", // Covered by wildcard cert
          lastVerifiedAt: new Date(),
        },
      });

      const response: CreateSubdomainResponse = {
        message: "Subdomain created and activated successfully. It's ready to use immediately!",
        domain: {
          id: newDomain.id,
          hostname: newDomain.hostname,
          type: newDomain.type,
          status: newDomain.status,
          sslStatus: newDomain.sslStatus,
          isVerified: true,
          isActive: true,
          azureCustomDomainName: newDomain.azureCustomDomainName,
          createdAt: newDomain.createdAt,
          updatedAt: newDomain.updatedAt,
        },
      };

      return CreateSubdomainResponseSchema.parse(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        console.error('[Subdomain Service] Zod validation error:', error.issues);
        const firstIssue = error.issues[0];
        const fieldPath = firstIssue?.path?.join('.') || 'unknown field';
        const message = `${fieldPath}: ${firstIssue?.message || "Invalid request data"}`;
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}
