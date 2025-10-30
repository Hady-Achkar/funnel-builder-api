import {
  DomainType,
  DomainStatus,
  SslStatus,
} from "../../../generated/prisma-client";
import { getPrisma } from "../../../lib/prisma";
import { validateHostname, parseDomain } from "./utils/domain-validation";
import {
  addCustomHostname,
  getCustomHostnameDetails,
} from "../../../../api/cloudflare";
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

      // Read Cloudflare configuration from environment variables
      const config = {
        apiToken: process.env.CF_API_TOKEN!,
        accountId: process.env.CF_ACCOUNT_ID,
      };

      // Use custom hostname zone (digitalsite.app) for custom domains
      const zoneId = process.env.CF_ZONE_ID!;
      const verificationDomain = process.env.CF_SUBDOMAIN;

      let initialHostname: any, detailedHostname: any;
      try {
        console.log(
          "[Domain Create] Creating custom hostname in Cloudflare..."
        );
        console.log("[Domain Create] Hostname:", validatedHostname);
        console.log("[Domain Create] Zone ID:", zoneId);

        initialHostname = await addCustomHostname(
          validatedHostname,
          zoneId,
          config,
          {
            sslMethod: "txt",
          }
        );
        console.log(
          "[Domain Create] Initial hostname created:",
          initialHostname.id
        );

        detailedHostname = await getCustomHostnameDetails(
          initialHostname.id,
          zoneId,
          config
        );
        console.log(
          "[Domain Create] Got detailed hostname:",
          detailedHostname.id
        );

        // SSL validation records may not be immediately available
        // Retry up to 3 times with increasing delays
        let retries = 0;
        const maxRetries = 3;
        while (
          (!detailedHostname.ssl?.validation_records ||
            detailedHostname.ssl.validation_records.length === 0) &&
          retries < maxRetries
        ) {
          retries++;
          const delay = retries * 2000; // 2s, 4s, 6s
          console.log(
            `[Domain Create] SSL validation records not ready, waiting ${delay}ms... (attempt ${retries}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));

          detailedHostname = await getCustomHostnameDetails(
            initialHostname.id,
            zoneId,
            config
          );

          if (
            detailedHostname.ssl?.validation_records &&
            detailedHostname.ssl.validation_records.length > 0
          ) {
            console.log(
              "[Domain Create] SSL validation records now available!"
            );
            break;
          }
        }

        if (
          !detailedHostname.ssl?.validation_records ||
          detailedHostname.ssl.validation_records.length === 0
        ) {
          console.warn(
            "[Domain Create] SSL validation records still not ready after retries. Customer can get them via verify endpoint."
          );
        }
      } catch (error: any) {
        const errMsg =
          error.response?.data?.errors?.[0]?.message || error.message;
        console.error(`[Domain Create] CloudFlare API Error: ${errMsg}`);
        console.error(
          "[Domain Create] Error response:",
          JSON.stringify(error.response?.data, null, 2)
        );
        console.error("[Domain Create] Error stack:", error.stack);
        throw new BadGatewayError(
          "External service error. Please try again later."
        );
      }

      const { id, ssl } = detailedHostname;
      console.log("[Domain Create] SSL object:", JSON.stringify(ssl, null, 2));
      console.log(
        "[Domain Create] SSL validation_records:",
        ssl?.validation_records
      );

      const ownershipVerificationRecord =
        initialHostname.ownership_verification;

      const cnameInstructions = {
        type: "CNAME",
        name: parsedDomain.subdomain,
        value: `origin.${verificationDomain}`,
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

      // Build records array starting with ownership verification and CNAME
      const dnsRecords: DNSSetupRecord[] = [
        {
          type: "TXT" as const,
          name: splittedOwnerVerificationName[0],
          value: ownershipVerificationRecord.value,
          purpose: "Domain Ownership Verification",
        },
        {
          type: "CNAME" as const,
          name: parsedDomain.subdomain,
          value: `origin.${verificationDomain}`,
          purpose: "Live Traffic",
        },
      ];

      // Add SSL validation TXT records if available
      if (ssl?.validation_records && Array.isArray(ssl.validation_records)) {
        ssl.validation_records.forEach((record: any) => {
          if (record.txt_name && record.txt_value) {
            // Most DNS providers want just the subdomain part (Host field)
            // Example: "_acme-challenge.www" (NOT the full "_acme-challenge.www.digitalsite.digital")
            // The DNS provider will automatically append ".digitalsite.digital"
            const fullDomain = `${parsedDomain.domain}.${parsedDomain.tld}`;
            const txtNameShort = record.txt_name.endsWith(`.${fullDomain}`)
              ? record.txt_name.slice(0, -(fullDomain.length + 1))
              : record.txt_name;

            dnsRecords.push({
              type: "TXT" as const,
              name: txtNameShort,
              value: record.txt_value,
              purpose: "SSL Certificate Validation",
              fullName: record.txt_name, // Include full name for reference
            } as any);
          }
        });
      }

      const setupInstructions = {
        records: dnsRecords,
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
