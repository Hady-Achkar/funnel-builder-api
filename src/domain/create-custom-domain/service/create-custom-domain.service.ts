import { PrismaClient, DomainType, DomainStatus, SslStatus } from "../../../generated/prisma-client";
import { validateHostname, parseDomain, getCloudFlareAPIHelper } from "../../shared/helpers";
import { addCustomHostname, getCustomHostnameDetails } from "../helpers";
import { 
  CreateCustomDomainRequest,
  CreateCustomDomainResponse,
  UserDomainLimits,
  UserDomainLimitsSchema,
  CreateCustomDomainRequestSchema,
  CreateCustomDomainResponseSchema,
  DNSSetupRecord
} from "../types";

// Allow prisma client to be injected for testing
let prisma = new PrismaClient();

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

export class CreateCustomDomainService {
  static async create(
    userId: number,
    requestData: CreateCustomDomainRequest
  ): Promise<CreateCustomDomainResponse> {
    // Validate request data
    const validatedData = CreateCustomDomainRequestSchema.parse(requestData);
    const { hostname } = validatedData;

    console.log(`[Domain Create] Starting custom domain creation for user ${userId}: ${hostname}`);

    try {
      // 1. Check user domain limits
      await this.checkUserDomainLimits(userId);

      // 2. Validate hostname and require subdomain
      const validatedHostname = validateHostname(hostname);
      const parsedDomain = parseDomain(validatedHostname);
      
      if (!parsedDomain.subdomain) {
        console.warn('[Domain Create] Apex domain detected; a subdomain is required');
        throw new Error('Please provide a subdomain (e.g. www.example.com)');
      }

      console.log('[Domain Create] Parsed domain parts:', parsedDomain);

      // 3. Check if domain already exists
      const existingDomain = await getPrisma().domain.findUnique({
        where: { hostname: validatedHostname },
      });

      if (existingDomain) {
        throw new Error('This domain name is taken, please choose another one.');
      }

      // 4. Get user's workspace
      const workspace = await getPrisma().workspace.findFirst({
        where: { ownerId: userId },
        select: { id: true },
      });

      if (!workspace) {
        throw new Error("User has no workspace");
      }

      // 5. Get CloudFlare configuration
      const cloudflareHelper = getCloudFlareAPIHelper();
      const config = cloudflareHelper.getConfig();
      const zoneId = config.cfZoneId;

      console.log(`[Domain Create] Using CloudFlare zone ID: ${zoneId}`);

      // 6. Create custom hostname in CloudFlare
      console.log('[Domain Create] Calling addCustomHostname()');
      const initialHostname = await addCustomHostname(validatedHostname, zoneId);
      console.log('[Domain Create] addCustomHostname() result:', initialHostname);

      // 7. Fetch detailed hostname info for SSL validation records
      console.log('[Domain Create] Fetching hostname details');
      const detailedHostname = await getCustomHostnameDetails(initialHostname.id, zoneId);
      console.log('[Domain Create] getCustomHostnameDetails() result:', detailedHostname);

      const { id, status, ssl } = detailedHostname;
      const ownershipVerificationRecord = initialHostname.ownership_verification;

      console.log(`[Domain Create] Parsed custom hostname ID: ${id}, status: ${status}, sslStatus: ${ssl?.status}`);

      // 8. Prepare database data
      const cnameInstructions = {
        type: 'CNAME',
        name: parsedDomain.subdomain,
        value: config.cfDomain, // CLOUDFLARE_SAAS_TARGET
        purpose: 'Live Traffic',
      };

      // 9. Save to database
      console.log('[Domain Create] Saving new domain to DB');
      const newDomain = await getPrisma().domain.create({
        data: {
          hostname: validatedHostname,
          type: DomainType.CUSTOM_DOMAIN,
          status: DomainStatus.PENDING,
          sslStatus: ssl?.status === 'active' ? SslStatus.ACTIVE : SslStatus.PENDING,
          workspaceId: workspace.id,
          createdBy: userId,
          cloudflareHostnameId: id,
          cloudflareZoneId: zoneId,
          verificationToken: ownershipVerificationRecord.value,
          ownershipVerification: ownershipVerificationRecord,
          dnsInstructions: cnameInstructions,
          sslValidationRecords: ssl?.validation_records ? 
            JSON.parse(JSON.stringify(ssl.validation_records)) : null,
        },
      });

      console.log('[Domain Create] New domain record created:', newDomain);

      // 10. Prepare setup instructions
      const splittedOwnerVerificationName = ownershipVerificationRecord.name.split('.');
      const setupInstructions = {
        records: [
          {
            type: 'TXT' as const,
            name: splittedOwnerVerificationName[0],
            value: ownershipVerificationRecord.value,
            purpose: 'Domain Ownership Verification',
          },
          {
            type: 'CNAME' as const,
            name: parsedDomain.subdomain,
            value: config.cfDomain,
            purpose: 'Live Traffic',
          },
        ] as DNSSetupRecord[],
      };

      console.log('[Domain Create] setupInstructions:', setupInstructions);

      // 11. Prepare response
      const response: CreateCustomDomainResponse = {
        message: 'Domain registered. Please add ALL of the following DNS records at your domain provider.',
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

      console.log('[Domain Create] Domain registered successfully');
      return CreateCustomDomainResponseSchema.parse(response);

    } catch (error: any) {
      const errMsg = error.response?.data?.errors?.[0]?.message || error.message;
      console.error(`[Domain Create] Error: ${errMsg}`, { stack: error.stack });
      throw new Error(errMsg || 'Failed to create domain.');
    }
  }

  private static async checkUserDomainLimits(userId: number): Promise<void> {
    // Get user with domain limits
    const user = await getPrisma().user.findUnique({
      where: { id: userId },
      select: { 
        id: true,
        maximumCustomDomains: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Count current custom domains
    const currentCustomDomainCount = await getPrisma().domain.count({
      where: { 
        createdBy: userId, 
        type: DomainType.CUSTOM_DOMAIN 
      },
    });

    const domainLimits: UserDomainLimits = {
      userId,
      maxCustomDomainsAllowed: user.maximumCustomDomains || 0,
      currentCustomDomainCount,
    };

    const validatedLimits = UserDomainLimitsSchema.parse(domainLimits);

    if (validatedLimits.currentCustomDomainCount >= validatedLimits.maxCustomDomainsAllowed) {
      console.warn(`[Domain Create] User has reached maximum custom domains limit: ${validatedLimits.maxCustomDomainsAllowed}`);
      throw new Error(`You have reached your limit of ${validatedLimits.maxCustomDomainsAllowed} custom domain(s).`);
    }

    console.log(`[Domain Create] Domain limits check passed: ${validatedLimits.currentCustomDomainCount}/${validatedLimits.maxCustomDomainsAllowed}`);
  }
}