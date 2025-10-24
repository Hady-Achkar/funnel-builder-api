import {
  DomainType,
  DomainStatus,
  SslStatus,
} from "../../../generated/prisma-client";
import { getPrisma } from "../../../lib/prisma";
import { getCloudFlareAPIHelper } from "../../../utils/domain-utils/cloudflare-api";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";
import { WorkspaceSubdomainAllocations } from "../../../utils/allocations/workspace-subdomain-allocations";
import { createARecord } from "./utils/create-a-record";
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
      const validatedData = createSubdomainRequest.parse(requestData);
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

      // Use provided domain config or default to mydigitalsite.io
      const baseDomain = domainConfig?.baseDomain || "mydigitalsite.io";
      const fullHostname = `${subdomain}.${baseDomain}`;

      const existingDomain = await getPrisma().domain.findUnique({
        where: { hostname: fullHostname },
      });

      if (existingDomain) {
        throw new BadRequestError(
          "This subdomain is already taken. Please choose another one."
        );
      }


      const cloudflareHelper = getCloudFlareAPIHelper();
      const config = cloudflareHelper.getConfig();

      // Use provided config or default values
      const zoneId = domainConfig?.zoneId || config.cfZoneId;
      const targetIp = domainConfig?.targetIp || "74.234.194.84";

      let aRecord: any;
      try {
        aRecord = await createARecord(
          subdomain,
          zoneId,
          targetIp
        );
      } catch (error: any) {
        const errMsg =
          error.response?.data?.errors?.[0]?.message || error.message;
        console.error(`[Subdomain Create] CloudFlare API Error: ${errMsg}`, {
          stack: error.stack,
        });
        throw new BadGatewayError(
          "External service error. Please try again later."
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
        const message = error.issues[0]?.message || "Invalid request data";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}
