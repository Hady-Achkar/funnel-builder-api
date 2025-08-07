import {
  validateHostname,
  validateSubdomain,
  parseDomain,
} from "../utils/domain-validation";
import { CloudFlareAPIService } from "./cloudflare/cloudflare-api.service";
import { cacheService } from "./cache/cache.service";
import {
  DomainStatus,
  DomainType,
  PrismaClient,
  SslStatus,
  $Enums,
} from "../generated/prisma-client";

// Allow prisma client to be injected for testing
let prisma = new PrismaClient();

// Lazy-loaded CloudFlare service
let cloudflare: CloudFlareAPIService | null = null;

export function getCloudFlareService(): CloudFlareAPIService {
  if (!cloudflare) {
    cloudflare = new CloudFlareAPIService();
  }
  return cloudflare;
}

// Function to get Prisma client (lazy initialization)
const getPrisma = (): PrismaClient => {
  if (!prisma) {
    // Only create default client if we're not in test environment
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

// Function to set Prisma client for testing
export const setPrismaClient = (client: PrismaClient) => {
  prisma = client;
};

export interface CreateDomainData {
  hostname: string;
  type: DomainType;
}

export interface CreateSubdomainData {
  subdomain: string;
}

export interface DomainWithConnections {
  id: number;
  hostname: string;
  type: DomainType;
  status: DomainStatus;
  sslStatus: SslStatus;
  userId: number;
  cloudflareHostnameId: string | null;
  cloudflareZoneId: string | null;
  cloudflareRecordId: string | null;
  verificationToken: string | null;
  ownershipVerification: any;
  dnsInstructions: any;
  sslValidationRecords: any;
  lastVerifiedAt: Date | null;
  funnelConnections: {
    id: number;
    funnelId: number;
    isActive: boolean;
    funnel: {
      id: number;
      name: string;
      status: string;
    };
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationInstructions {
  ownershipVerification?: {
    type: string;
    name: string;
    value: string;
    purpose: string;
  };
  dnsInstructions?: {
    type: string;
    name: string;
    value: string;
    purpose: string;
  };
}

export class DomainService {
  static async createCustomDomain(
    userId: number,
    data: CreateDomainData
  ): Promise<DomainWithConnections> {
    const hostname = validateHostname(data.hostname);
    const parsed = parseDomain(hostname);

    // Require subdomain for custom domains
    if (!parsed.subdomain) {
      throw new Error("Please provide a subdomain (e.g. www.example.com)");
    }

    // Check if domain already exists
    const existingDomain = await getPrisma().domain.findUnique({
      where: { hostname },
    });

    if (existingDomain) {
      throw new Error("This domain name is already registered");
    }

    try {
      // Create custom hostname in CloudFlare
      console.log(`[Domain Create] Creating custom hostname for: ${hostname}`);
      const cf = getCloudFlareService();
      if (!cf.isConfigured()) {
        throw new Error(
          "CloudFlare is not configured for custom domain creation"
        );
      }
      const cfHostname = await cf.createCustomHostname(hostname);

      // Get detailed hostname info for SSL validation records
      const detailedHostname = await cf.getCustomHostname(cfHostname.id);

      const config = cf.getConfig();
      const ownershipVerification = cfHostname.ownership_verification;
      const ownershipNameParts = ownershipVerification.name.split(".");

      // Create domain record with CloudFlare data
      const domain = await getPrisma().domain.create({
        data: {
          hostname,
          type: DomainType.CUSTOM_DOMAIN,
          status: DomainStatus.PENDING,
          sslStatus:
            detailedHostname.ssl.status === "active"
              ? SslStatus.ACTIVE
              : SslStatus.PENDING,
          userId,
          cloudflareHostnameId: cfHostname.id,
          cloudflareZoneId: config.zoneId,
          verificationToken: ownershipVerification.value,
          ownershipVerification: {
            type: ownershipVerification.type,
            name: ownershipNameParts[0], // Remove domain suffix
            value: ownershipVerification.value,
            purpose: "Domain Ownership Verification",
          },
          dnsInstructions: {
            type: "CNAME",
            name: parsed.subdomain,
            value: config.saasTarget,
            purpose: "Live Traffic",
          },
          sslValidationRecords: detailedHostname.ssl.validation_records
            ? JSON.parse(
                JSON.stringify(detailedHostname.ssl.validation_records)
              )
            : null,
        },
        include: {
          funnelConnections: {
            include: {
              funnel: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      console.log(
        `[Domain Create] Custom domain created with ID: ${domain.id}`
      );

      // Invalidate user cache
      await cacheService.invalidateUserCache(userId);

      return domain;
    } catch (error: any) {
      console.error("[Domain Create] CloudFlare error:", error);
      throw new Error(`Failed to create custom domain: ${error.message}`);
    }
  }

  static async createSubdomain(
    userId: number,
    data: CreateSubdomainData
  ): Promise<DomainWithConnections> {
    const subdomain = validateSubdomain(data.subdomain);
    const cf = getCloudFlareService();
    if (!cf.isConfigured()) {
      throw new Error("CloudFlare is not configured for subdomain creation");
    }
    const config = cf.getConfig();
    const hostname = `${subdomain}.${config.platformMainDomain}`;

    // Check if subdomain already exists
    const existingDomain = await getPrisma().domain.findUnique({
      where: { hostname },
    });

    if (existingDomain) {
      throw new Error("This subdomain is already taken");
    }

    try {
      console.log(`[Subdomain Create] Creating subdomain: ${hostname}`);

      // Create A record in CloudFlare for the subdomain
      const dnsRecord = await cf.createSubdomainRecord(subdomain);

      // Create subdomain record (immediately active)
      const domain = await getPrisma().domain.create({
        data: {
          hostname,
          type: DomainType.SUBDOMAIN,
          status: DomainStatus.ACTIVE,
          sslStatus: SslStatus.ACTIVE,
          userId,
          cloudflareZoneId: config.zoneId,
          cloudflareRecordId: dnsRecord.id,
          lastVerifiedAt: new Date(),
        },
        include: {
          funnelConnections: {
            include: {
              funnel: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      console.log(`[Subdomain Create] Subdomain created with ID: ${domain.id}`);

      // Invalidate user cache
      await cacheService.invalidateUserCache(userId);

      return domain;
    } catch (error: any) {
      console.error("[Subdomain Create] CloudFlare error:", error);
      throw new Error(`Failed to create subdomain: ${error.message}`);
    }
  }

  static async getUserDomains(
    userId: number
  ): Promise<DomainWithConnections[]> {
    return cacheService.memoize(
      "domains",
      async () => {
        const domains = await getPrisma().domain.findMany({
          where: { userId },
          include: {
            funnelConnections: {
              include: {
                funnel: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return domains;
      },
      { prefix: `user:${userId}`, ttl: 300 } // 5 minutes cache
    );
  }

  static async getDomainById(
    domainId: number,
    userId: number
  ): Promise<DomainWithConnections | null> {
    const domain = await getPrisma().domain.findFirst({
      where: {
        id: domainId,
        userId,
      },
      include: {
        funnelConnections: {
          include: {
            funnel: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return domain;
  }

  static async getDomainByHostname(
    hostname: string
  ): Promise<DomainWithConnections | null> {
    const domain = await getPrisma().domain.findUnique({
      where: { hostname },
      include: {
        funnelConnections: {
          where: { isActive: true },
          include: {
            funnel: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return domain;
  }

  static async verifyDomain(
    domainId: number,
    userId: number
  ): Promise<DomainWithConnections> {
    const domain = await getPrisma().domain.findFirst({
      where: {
        id: domainId,
        userId,
      },
      include: {
        funnelConnections: {
          where: { isActive: true },
          include: {
            funnel: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!domain) {
      throw new Error("Domain not found");
    }

    if (domain.status === DomainStatus.ACTIVE) {
      throw new Error("Domain is already active");
    }

    if (!domain.cloudflareHostnameId) {
      throw new Error("Domain is not configured correctly");
    }

    try {
      console.log(
        `[Domain Verify] Checking verification status for domain: ${domain.hostname}`
      );

      // Get current status from CloudFlare
      const cf = getCloudFlareService();
      if (!cf.isConfigured()) {
        // If CloudFlare is not configured, return cached status
        return domain;
      }
      const cfHostname = await cf.getCustomHostname(
        domain.cloudflareHostnameId
      );

      // Update domain record with latest CloudFlare status
      const updateData: any = {
        sslStatus:
          cfHostname.ssl.status === "active"
            ? SslStatus.ACTIVE
            : cfHostname.ssl.status === "pending_validation"
            ? SslStatus.PENDING
            : SslStatus.ERROR,
        lastVerifiedAt: new Date(),
      };

      let message = `Verification is still in progress. Status: "${cfHostname.status}", SSL: "${cfHostname.ssl.status}".`;
      let isFullyActive = false;

      // Check if domain is fully active
      if (
        cfHostname.status === "active" &&
        cfHostname.ssl.status === "active"
      ) {
        updateData.status = DomainStatus.ACTIVE;
        message =
          "Congratulations! Your domain is fully configured and active.";
        isFullyActive = true;
      } else if (cfHostname.status === "active") {
        updateData.status = DomainStatus.VERIFIED;
      }

      // Update SSL validation records if available
      if (cfHostname.ssl.validation_records) {
        updateData.sslValidationRecords = JSON.parse(
          JSON.stringify(cfHostname.ssl.validation_records)
        );
      }

      const updatedDomain = await getPrisma().domain.update({
        where: { id: domainId },
        data: updateData,
        include: {
          funnelConnections: {
            include: {
              funnel: {
                select: {
                  id: true,
                  name: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      console.log(`[Domain Verify] Domain verification result: ${message}`);
      return updatedDomain;
    } catch (error: any) {
      console.error("[Domain Verify] CloudFlare error:", error);
      throw new Error(`Failed to verify domain: ${error.message}`);
    }
  }

  static async deleteDomain(domainId: number, userId: number): Promise<void> {
    const domain = await getPrisma().domain.findFirst({
      where: {
        id: domainId,
        userId,
      },
    });

    if (!domain) {
      throw new Error("Domain not found");
    }

    console.log(`[Domain Delete] Starting deletion for ${domain.hostname}`);

    try {
      // Delete custom hostname from CloudFlare if it exists
      if (domain.cloudflareHostnameId) {
        try {
          console.log(
            `[Domain Delete] Deleting custom hostname ${domain.cloudflareHostnameId} from CloudFlare`
          );
          const cf = getCloudFlareService();
          if (cf.isConfigured()) {
            await cf.deleteCustomHostname(domain.cloudflareHostnameId);
          }
          console.log(
            `[Domain Delete] Successfully deleted custom hostname ${domain.cloudflareHostnameId}`
          );
        } catch (cfError: any) {
          if (cfError.message.includes("not found")) {
            console.warn(
              `[Domain Delete] Custom hostname ${domain.cloudflareHostnameId} not found in CloudFlare (already deleted)`
            );
          } else {
            console.error(
              `[Domain Delete] Failed to delete custom hostname from CloudFlare:`,
              cfError.message
            );
            // Continue with database deletion even if CloudFlare deletion fails
          }
        }
      }

      // Delete DNS record from CloudFlare if it exists (for subdomains)
      if (domain.cloudflareRecordId && domain.cloudflareZoneId) {
        try {
          console.log(
            `[Domain Delete] Deleting DNS record ${domain.cloudflareRecordId} from CloudFlare`
          );
          const cf = getCloudFlareService();
          if (cf.isConfigured()) {
            await cf.deleteDNSRecord(
              domain.cloudflareZoneId,
              domain.cloudflareRecordId
            );
          }
          console.log(
            `[Domain Delete] Successfully deleted DNS record ${domain.cloudflareRecordId}`
          );
        } catch (cfError: any) {
          if (cfError.message.includes("not found")) {
            console.warn(
              `[Domain Delete] DNS record ${domain.cloudflareRecordId} not found in CloudFlare (already deleted)`
            );
          } else {
            console.error(
              `[Domain Delete] Failed to delete DNS record from CloudFlare:`,
              cfError.message
            );
            // Continue with database deletion even if CloudFlare deletion fails
          }
        }
      }

      // Delete from database
      await getPrisma().domain.delete({
        where: { id: domainId },
      });

      console.log(
        `[Domain Delete] Successfully deleted domain ${domain.hostname} from database`
      );
    } catch (error: any) {
      console.error("[Domain Delete] Error:", error);
      throw new Error(`Failed to delete domain: ${error.message}`);
    }
  }

  static async linkFunnelToDomain(
    funnelId: number,
    domainId: number,
    userId: number
  ): Promise<void> {
    // Verify funnel belongs to user
    const funnel = await getPrisma().funnel.findFirst({
      where: {
        id: funnelId,
        userId,
      },
    });

    if (!funnel) {
      throw new Error("Funnel not found");
    }

    // Verify domain belongs to user
    const domain = await getPrisma().domain.findFirst({
      where: {
        id: domainId,
        userId,
      },
    });

    if (!domain) {
      throw new Error("Domain not found");
    }

    // Check if connection already exists
    const existingConnection = await getPrisma().funnelDomain.findUnique({
      where: {
        funnelId_domainId: {
          funnelId,
          domainId,
        },
      },
    });

    if (existingConnection) {
      throw new Error("Funnel is already linked to this domain");
    }

    // Create connection
    await getPrisma().funnelDomain.create({
      data: {
        funnelId,
        domainId,
        isActive: true,
      },
    });
  }

  static async unlinkFunnelFromDomain(
    funnelId: number,
    domainId: number,
    userId: number
  ): Promise<void> {
    // Verify ownership through funnel
    const funnel = await getPrisma().funnel.findFirst({
      where: {
        id: funnelId,
        userId,
      },
    });

    if (!funnel) {
      throw new Error("Funnel not found");
    }

    // Delete connection
    const deleted = await getPrisma().funnelDomain.deleteMany({
      where: {
        funnelId,
        domainId,
      },
    });

    if (deleted.count === 0) {
      throw new Error("Connection not found");
    }
  }

  static async getVerificationInstructions(
    domainId: number,
    userId: number
  ): Promise<VerificationInstructions> {
    const domain = await getPrisma().domain.findFirst({
      where: {
        id: domainId,
        userId,
      },
      select: {
        ownershipVerification: true,
        dnsInstructions: true,
      },
    });

    if (!domain) {
      throw new Error("Domain not found");
    }

    return {
      ownershipVerification: domain.ownershipVerification as any,
      dnsInstructions: domain.dnsInstructions as any,
    };
  }

  static async getPublicFunnel(
    hostname: string,
    funnelId: number
  ): Promise<any> {
    const domain = await getPrisma().domain.findUnique({
      where: {
        hostname,
        status: DomainStatus.ACTIVE,
      },
      include: {
        funnelConnections: {
          where: {
            funnelId,
            isActive: true,
          },
          include: {
            funnel: {
              include: {
                pages: {
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!domain) {
      throw new Error("Domain not found or not verified");
    }

    const connection = domain.funnelConnections[0];
    if (!connection) {
      throw new Error("Funnel not linked to this domain");
    }

    if (connection.funnel.status !== $Enums.FunnelStatus.LIVE) {
      throw new Error("Funnel is not live");
    }

    return connection.funnel;
  }
}
