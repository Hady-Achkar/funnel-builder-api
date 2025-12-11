import {
  DomainType,
  DomainStatus,
  SslStatus,
} from "../../../generated/prisma-client";
import { getPrisma } from "../../../lib/prisma";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";
import { WorkspaceSubdomainAllocations } from "../../../utils/allocations/workspace-subdomain-allocations";
import { createARecord } from "../../../cloudflare";
import {
  CreateSubdomainResponse,
  createSubdomainRequest,
  createSubdomainResponse,
} from "../../../types/domain/create-subdomain";
import { DomainConfig } from "../../../types/domain/shared/domain.types";
import { BadRequestError, BadGatewayError } from "../../../errors/http-errors";
import { ZodError } from "zod";

export class CreateSubdomainService {
  static async create(
    userId: number,
    requestData: unknown,
    domainConfig?: DomainConfig
  ): Promise<CreateSubdomainResponse> {
    try {
      console.log("[Subdomain Service] Received request data:", requestData);
      console.log("[Subdomain Service] Request data type:", typeof requestData);

      const validatedData = createSubdomainRequest.parse(requestData);
      console.log("[Subdomain Service] Validated data:", validatedData);

      const { subdomain, workspaceSlug } = validatedData;

      // Get workspace by slug
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

      // Check subdomain limit using centralized allocation utility
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

      // Use provided domain config or default to environment variable for digitalsite.app
      const baseDomain =
        domainConfig?.baseDomain ||
        process.env.CF_SUBDOMAIN ||
        "digitalsite.app";
      const fullHostname = `${subdomain}.${baseDomain}`;

      // Check if subdomain already exists in database
      const existingDomain = await getPrisma().domain.findUnique({
        where: { hostname: fullHostname },
      });

      if (existingDomain) {
        throw new BadRequestError(
          `The subdomain "${subdomain}" is already in use. Please try a different name.`
        );
      }

      // Read Cloudflare configuration from environment variables
      const config = {
        apiToken: process.env.CF_API_TOKEN!,
        accountId: process.env.CF_ACCOUNT_ID,
      };

      // Use provided config or default values from environment
      const zoneId = domainConfig?.zoneId || process.env.CF_ZONE_ID!;
      const targetIp = domainConfig?.targetIp || process.env.CF_IP!;

      let aRecord: any;
      try {
        // Use Cloudflare API function directly
        aRecord = await createARecord(subdomain, zoneId, targetIp, config, {
          ttl: 3600,
          proxied: true,
        });
      } catch (error: any) {
        const errMsg =
          error.response?.data?.errors?.[0]?.message || error.message;
        console.error(`[Subdomain Create] Cloudflare API Error: ${errMsg}`, {
          stack: error.stack,
        });
        throw new BadGatewayError(
          "We couldn't create your subdomain at this time. Please try again later or contact support if the problem persists."
        );
      }

      const newDomain = await getPrisma().domain.create({
        data: {
          hostname: fullHostname,
          type: DomainType.SUBDOMAIN,
          status: DomainStatus.ACTIVE,
          sslStatus: SslStatus.ACTIVE,
          workspaceId: workspace.id,
          createdBy: userId,
          cloudflareRecordId: aRecord.id,
          cloudflareZoneId: zoneId,
          lastVerifiedAt: new Date(),
        },
      });

      const response: CreateSubdomainResponse = {
        message: "Subdomain created and activated successfully.",
        domain: {
          id: newDomain.id,
          hostname: newDomain.hostname,
          type: newDomain.type,
          status: newDomain.status,
          sslStatus: newDomain.sslStatus,
          isVerified: newDomain.status !== DomainStatus.PENDING,
          isActive: newDomain.status === DomainStatus.ACTIVE,
          cloudflareRecordId: newDomain.cloudflareRecordId,
          createdAt: newDomain.createdAt,
          updatedAt: newDomain.updatedAt,
        },
      };

      return createSubdomainResponse.parse(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        console.error(
          "[Subdomain Service] Zod validation error:",
          error.issues
        );
        const firstIssue = error.issues[0];
        const fieldPath = firstIssue?.path?.join(".") || "unknown field";
        const message = `${fieldPath}: ${
          firstIssue?.message || "Invalid request data"
        }`;
        throw new BadRequestError(message);
      }
      console.error("[Subdomain Service] Unexpected error:", error);
      throw error;
    }
  }
}
