import {
  DomainType,
  DomainStatus,
  SslStatus,
  $Enums,
} from "../../../generated/prisma-client";
import { getPrisma } from "../../../lib/prisma";
import {
  validateHostname,
  parseDomain,
  getCloudFlareAPIHelper,
  addCustomHostname,
  getCustomHostnameDetails,
  validateWorkspaceAccess,
} from "../../../helpers/domain/shared";
import { checkWorkspaceDomainLimits } from "../../../helpers/domain/create-custom-domain";
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
      });

      if (!workspace) {
        throw new BadRequestError("Workspace not found");
      }

      await validateWorkspaceAccess(userId, workspace.id, [
        $Enums.WorkspacePermission.CREATE_DOMAINS,
      ]);
      await checkWorkspaceDomainLimits(workspace.id);

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
