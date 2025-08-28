import {
  PrismaClient,
  DomainType,
  DomainStatus,
  SslStatus,
} from "../../../generated/prisma-client";
import { getCloudFlareAPIHelper } from "../../shared/helpers";
import {
  CreateSubdomainRequest,
  CreateSubdomainResponse,
  UserSubdomainLimits,
  createSubdomainRequest,
  createSubdomainResponse,
  userSubdomainLimits,
} from "../types/create-subdomain.types";

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

export class CreateSubdomainService {
  static async create(
    userId: number,
    requestData: CreateSubdomainRequest
  ): Promise<CreateSubdomainResponse> {
    const validatedData = createSubdomainRequest.parse(requestData);
    const { subdomain } = validatedData;

    try {
      await this.checkUserSubdomainLimits(userId);

      const fullHostname = `${subdomain}.mydigitalsite.io`;

      const existingDomain = await getPrisma().domain.findUnique({
        where: { hostname: fullHostname },
      });

      if (existingDomain) {
        throw new Error("Subdomain already registered");
      }

      const workspace = await getPrisma().workspace.findFirst({
        where: { ownerId: userId },
        select: { id: true },
      });

      if (!workspace) {
        throw new Error("User has no workspace");
      }

      console.log(`[Create Subdomain] Creating subdomain: ${fullHostname}`);

      const cloudflareHelper = getCloudFlareAPIHelper();
      const config = cloudflareHelper.getConfig();

      // Create A record in CloudFlare (using the same zone as CF_ZONE_ID)
      const aRecord = await this.createARecord(
        subdomain,
        config.cfZoneId,
        "74.234.194.84" // IP from the original Strapi code
      );

      console.log(`[Create Subdomain] Created A record with ID: ${aRecord.id}`);

      // Create domain record in database
      const newDomain = await getPrisma().domain.create({
        data: {
          hostname: fullHostname,
          type: DomainType.SUBDOMAIN,
          status: DomainStatus.ACTIVE, // Subdomains are immediately active
          sslStatus: SslStatus.ACTIVE, // SSL is handled by our wildcard cert
          workspaceId: workspace.id,
          createdBy: userId,
          cloudflareRecordId: aRecord.id,
          cloudflareZoneId: config.cfZoneId,
          lastVerifiedAt: new Date(),
        },
      });

      console.log(`[Create Subdomain] Created domain record with ID: ${newDomain.id}`);

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
    } catch (error: any) {
      const errMsg =
        error.response?.data?.errors?.[0]?.message || error.message;
      console.error(`[Create Subdomain] Error: ${errMsg}`, { stack: error.stack });
      throw new Error(errMsg || "Failed to create subdomain.");
    }
  }

  private static async createARecord(
    subdomain: string,
    zoneId: string,
    ipAddress: string
  ) {
    const cloudflareHelper = getCloudFlareAPIHelper();
    const cf = cloudflareHelper.getAxiosInstance();

    const payload = {
      type: "A",
      name: subdomain,
      content: ipAddress,
      ttl: 3600,
      proxied: true,
    };

    const url = `/zones/${zoneId}/dns_records`;
    const response = await cf.post(url, payload);

    return response.data.result;
  }

  private static async checkUserSubdomainLimits(userId: number): Promise<void> {
    const user = await getPrisma().user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        maximumSubdomains: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const currentSubdomainCount = await getPrisma().domain.count({
      where: {
        createdBy: userId,
        type: DomainType.SUBDOMAIN,
      },
    });

    const domainLimits: UserSubdomainLimits = {
      userId,
      maxSubdomainsAllowed: user.maximumSubdomains || 0,
      currentSubdomainCount,
    };

    const validatedLimits = userSubdomainLimits.parse(domainLimits);

    if (
      validatedLimits.currentSubdomainCount >=
      validatedLimits.maxSubdomainsAllowed
    ) {
      console.warn(
        `[Create Subdomain] User has reached maximum subdomains limit: ${validatedLimits.maxSubdomainsAllowed}`
      );
      throw new Error(
        `You have reached your limit of ${validatedLimits.maxSubdomainsAllowed} subdomain(s).`
      );
    }
  }
}