import {
  PrismaClient,
  DomainType,
  DomainStatus,
  SslStatus,
} from "../../../generated/prisma-client";
import {
  validateHostname,
  parseDomain,
  getCloudFlareAPIHelper,
} from "../../shared/helpers";
import { addCustomHostname, getCustomHostnameDetails } from "../helpers";
import {
  CreateCustomDomainRequest,
  CreateCustomDomainResponse,
  UserDomainLimits,
  UserDomainLimitsSchema,
  CreateCustomDomainRequestSchema,
  CreateCustomDomainResponseSchema,
  DNSSetupRecord,
} from "../types";

let prisma = new PrismaClient();

const getPrisma = (): PrismaClient => {
  if (!prisma) {
    if (process.env.NODE_ENV !== "test") {
      prisma = new PrismaClient();
    } else {
      throw new Error(
        "PrismaClient not set for test environment. Call setPrismaClient() first."
      );
    }
  }
  return prisma;
};

export const setPrismaClient = (client: PrismaClient) => {
  prisma = client;
};

export class CreateCustomDomainService {
  static async create(
    userId: number,
    requestData: CreateCustomDomainRequest
  ): Promise<CreateCustomDomainResponse> {
    const validatedData = CreateCustomDomainRequestSchema.parse(requestData);
    const { hostname } = validatedData;

    try {
      await this.checkUserDomainLimits(userId);

      const validatedHostname = validateHostname(hostname);
      const parsedDomain = parseDomain(validatedHostname);

      if (!parsedDomain.subdomain) {
        console.warn(
          "[Domain Create] Apex domain detected; a subdomain is required"
        );
        throw new Error("Please provide a subdomain (e.g. www.example.com)");
      }

      const existingDomain = await getPrisma().domain.findUnique({
        where: { hostname: validatedHostname },
      });

      if (existingDomain) {
        throw new Error(
          "This domain name is taken, please choose another one."
        );
      }

      const workspace = await getPrisma().workspace.findFirst({
        where: { ownerId: userId },
        select: { id: true },
      });

      if (!workspace) {
        throw new Error("User has no workspace");
      }

      const cloudflareHelper = getCloudFlareAPIHelper();
      const config = cloudflareHelper.getConfig();
      const zoneId = config.cfZoneId;

      const initialHostname = await addCustomHostname(
        validatedHostname,
        zoneId
      );

      const detailedHostname = await getCustomHostnameDetails(
        initialHostname.id,
        zoneId
      );

      const { id, status, ssl } = detailedHostname;
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
    } catch (error: any) {
      const errMsg =
        error.response?.data?.errors?.[0]?.message || error.message;
      console.error(`[Domain Create] Error: ${errMsg}`, { stack: error.stack });
      throw new Error(errMsg || "Failed to create domain.");
    }
  }

  private static async checkUserDomainLimits(userId: number): Promise<void> {
    const user = await getPrisma().user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        maximumCustomDomains: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const currentCustomDomainCount = await getPrisma().domain.count({
      where: {
        createdBy: userId,
        type: DomainType.CUSTOM_DOMAIN,
      },
    });

    const domainLimits: UserDomainLimits = {
      userId,
      maxCustomDomainsAllowed: user.maximumCustomDomains || 0,
      currentCustomDomainCount,
    };

    const validatedLimits = UserDomainLimitsSchema.parse(domainLimits);

    if (
      validatedLimits.currentCustomDomainCount >=
      validatedLimits.maxCustomDomainsAllowed
    ) {
      console.warn(
        `[Domain Create] User has reached maximum custom domains limit: ${validatedLimits.maxCustomDomainsAllowed}`
      );
      throw new Error(
        `You have reached your limit of ${validatedLimits.maxCustomDomainsAllowed} custom domain(s).`
      );
    }
  }
}
