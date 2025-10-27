import {
  DomainType,
  DomainStatus,
  SslStatus,
} from "../../../generated/prisma-client";
import { getPrisma } from "../../../lib/prisma";
import { validateHostname, parseDomain } from "./utils/domain-validation";
import {
  getAzureFrontDoorAPIHelper,
  getAzureFrontDoorConfig,
  sanitizeHostnameForAzure,
} from "../../../utils/domain-utils/azure-frontdoor-api";
import {
  createAzureFrontDoorCustomDomain,
  getAzureFrontDoorCustomDomainDetails,
} from "../../../utils/domain-utils/azure-frontdoor-custom-domain";
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

      // Azure Front Door supports both apex and subdomain
      // No need to enforce subdomain requirement

      const existingDomain = await getPrisma().domain.findUnique({
        where: { hostname: validatedHostname },
      });

      if (existingDomain) {
        throw new BadRequestError(
          "This domain name is taken, please choose another one."
        );
      }

      const azureConfig = getAzureFrontDoorConfig();
      const azureCustomDomainName = sanitizeHostnameForAzure(validatedHostname);

      let customDomain: any;
      try {
        // Create custom domain in Azure Front Door
        customDomain = await createAzureFrontDoorCustomDomain(validatedHostname);

        console.log("[Domain Create] Azure Front Door custom domain created:", {
          hostname: validatedHostname,
          azureName: azureCustomDomainName,
          validationToken: customDomain.validationProperties.validationToken,
        });
      } catch (error: any) {
        console.error(`[Domain Create] Azure Front Door API Error: ${error.message}`, {
          stack: error.stack,
        });
        throw new BadGatewayError(
          "We couldn't register your domain at this time. Please try again in a few minutes or contact support if the issue persists."
        );
      }

      const { validationProperties, domainValidationState, tlsSettings } = customDomain;

      // DNS instructions for Azure Front Door
      const cnameInstructions = {
        type: "CNAME",
        name: parsedDomain.subdomain || "@",
        value: azureConfig.frontDoorEndpointUrl,
        purpose: "Live Traffic",
      };

      const newDomain = await getPrisma().domain.create({
        data: {
          hostname: validatedHostname,
          type: DomainType.CUSTOM_DOMAIN,
          status: DomainStatus.PENDING,
          sslStatus: SslStatus.PENDING,
          workspaceId: workspace.id,
          createdBy: userId,
          azureCustomDomainName: azureCustomDomainName,
          azureDomainStatus: domainValidationState,
          azureCertStatus: tlsSettings?.certificateType || "Pending",
          verificationToken: validationProperties.validationToken,
          ownershipVerification: {
            name: `_dnsauth.${validatedHostname}`,
            value: validationProperties.validationToken,
            type: "TXT",
          },
          dnsInstructions: cnameInstructions,
        },
      });

      const setupInstructions = {
        records: [
          {
            type: "TXT" as const,
            name: "_dnsauth",
            value: validationProperties.validationToken,
            purpose: "Domain Ownership Verification",
          },
          {
            type: "CNAME" as const,
            name: parsedDomain.subdomain || "@",
            value: azureConfig.frontDoorEndpointUrl,
            purpose: "Live Traffic",
          },
        ] as DNSSetupRecord[],
      };

      const response: CreateCustomDomainResponse = {
        message:
          "Domain registered successfully! Please add ALL of the following DNS records at your domain provider (GoDaddy, Namecheap, Cloudflare, etc.).",
        domain: {
          id: newDomain.id,
          hostname: newDomain.hostname,
          type: newDomain.type,
          status: newDomain.status,
          sslStatus: newDomain.sslStatus,
          isVerified: false,
          isActive: false,
          verificationToken: newDomain.verificationToken,
          customHostnameId: newDomain.azureCustomDomainName,
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
