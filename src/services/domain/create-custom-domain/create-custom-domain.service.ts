import {
  DomainType,
  DomainStatus,
  SslStatus,
} from "../../../generated/prisma-client";
import { getPrisma } from "../../../lib/prisma";
import { validateHostname, parseDomain } from "./utils/domain-validation";
import { getCloudFlareAPIHelper } from "../../../utils/domain-utils/cloudflare-api";
import {
  addCustomHostname,
  getCustomHostnameDetails,
} from "../../../utils/domain-utils/cloudflare-custom-hostname";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";
import { WorkspaceCustomDomainAllocations } from "../../../utils/allocations/workspace-custom-domain-allocations";
import {
  CreateCustomDomainResponse,
  CreateCustomDomainRequestSchema,
  CreateCustomDomainResponseSchema,
  DNSSetupRecord,
} from "../../../types/domain/create-custom-domain";
import { BadRequestError, BadGatewayError } from "../../../errors/http-errors";
import { ZodError } from "zod";

export class CreateCustomDomainService {
  static async create(
    userId: number,
    requestData: unknown
  ): Promise<CreateCustomDomainResponse> {
    try {
      // Validate request data
      const validatedData = CreateCustomDomainRequestSchema.parse(requestData);
      const { hostname, workspaceSlug } = validatedData;

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

      // Check permission using centralized PermissionManager
      await PermissionManager.requirePermission({
        userId,
        workspaceId: workspace.id,
        action: PermissionAction.CREATE_CUSTOM_DOMAIN,
      });

      // Check custom domain limit using centralized allocation utility
      const currentCustomDomainCount = await getPrisma().domain.count({
        where: {
          workspaceId: workspace.id,
          type: DomainType.CUSTOM_DOMAIN,
        },
      });

      const canCreate = WorkspaceCustomDomainAllocations.canCreateCustomDomain(
        currentCustomDomainCount,
        {
          workspacePlanType: workspace.planType,
          addOns: workspace.addOns,
        }
      );

      if (!canCreate) {
        const summary = WorkspaceCustomDomainAllocations.getAllocationSummary(
          currentCustomDomainCount,
          {
            workspacePlanType: workspace.planType,
            addOns: workspace.addOns,
          }
        );

        throw new BadRequestError(
          `This workspace has reached its maximum limit of ${summary.totalAllocation} custom domain(s). You are currently using ${summary.currentUsage} custom domain(s).`
        );
      }

      const validatedHostname = validateHostname(hostname);
      const parsedDomain = parseDomain(validatedHostname);

      if (!parsedDomain.subdomain) {
        console.warn(
          "[Domain Create] Apex domain detected; a subdomain is required"
        );
        throw new BadRequestError(
          "Please provide a subdomain (e.g. www.example.com)"
        );
      }

      const existingDomain = await getPrisma().domain.findUnique({
        where: { hostname: validatedHostname },
      });

      if (existingDomain) {
        throw new BadRequestError(
          "This domain name is taken, please choose another one."
        );
      }

      const cloudflareHelper = getCloudFlareAPIHelper();
      const config = cloudflareHelper.getConfig();
      const zoneId = config.cfZoneId;

      let initialHostname: any, detailedHostname: any;
      try {
        initialHostname = await addCustomHostname(validatedHostname, zoneId);

        detailedHostname = await getCustomHostnameDetails(
          initialHostname.id,
          zoneId
        );
      } catch (error: any) {
        const errMsg =
          error.response?.data?.errors?.[0]?.message || error.message;
        console.error(`[Domain Create] CloudFlare API Error: ${errMsg}`, {
          stack: error.stack,
        });
        throw new BadGatewayError(
          "External service error. Please try again later."
        );
      }

      const { id, ssl } = detailedHostname;
      const ownershipVerificationRecord =
        initialHostname.ownership_verification;

      const cnameInstructions = {
        type: "CNAME",
        name: parsedDomain.subdomain,
        value: `fallback.${config.cfDomain}`,
        purpose: "Live Traffic",
      };

      const newDomain = await getPrisma().domain.create({
        data: {
          hostname: validatedHostname,
          type: DomainType.CUSTOM_DOMAIN,
          status: DomainStatus.PENDING,
          sslStatus:
            ssl?.status === "active" ? SslStatus.ACTIVE : SslStatus.PENDING,
          workspaceId: workspace.id,
          createdBy: userId,
          cloudflareHostnameId: id,
          cloudflareZoneId: zoneId,
          verificationToken: ownershipVerificationRecord.value,
          ownershipVerification: ownershipVerificationRecord,
          dnsInstructions: cnameInstructions,
          sslValidationRecords: ssl?.validation_records
            ? JSON.parse(JSON.stringify(ssl.validation_records))
            : null,
        },
      });

      const splittedOwnerVerificationName =
        ownershipVerificationRecord.name.split(".");
      const setupInstructions = {
        records: [
          {
            type: "TXT" as const,
            name: splittedOwnerVerificationName[0],
            value: ownershipVerificationRecord.value,
            purpose: "Domain Ownership Verification",
          },
          {
            type: "CNAME" as const,
            name: parsedDomain.subdomain,
            value: `fallback.${config.cfDomain}`,
            purpose: "Live Traffic",
          },
        ] as DNSSetupRecord[],
      };

      const response: CreateCustomDomainResponse = {
        message:
          "Domain registered. Please add ALL of the following DNS records at your domain provider.",
        domain: {
          id: newDomain.id,
          hostname: newDomain.hostname,
          type: newDomain.type,
          status: newDomain.status,
          sslStatus: newDomain.sslStatus,
          isVerified: false,
          isActive: false,
          verificationToken: newDomain.verificationToken,
          customHostnameId: newDomain.cloudflareHostnameId,
          ownershipVerification: newDomain.ownershipVerification,
          cnameVerificationInstructions: newDomain.dnsInstructions,
          createdAt: newDomain.createdAt,
          updatedAt: newDomain.updatedAt,
        },
        setupInstructions,
      };

      return CreateCustomDomainResponseSchema.parse(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid request data";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}
