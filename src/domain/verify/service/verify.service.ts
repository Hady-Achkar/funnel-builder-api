import { PrismaClient } from "../../../generated/prisma-client";
import { getCloudFlareAPIHelper } from "../../shared/helpers";
import { getCustomHostnameDetails } from "../../create-custom-domain/helpers";
import { 
  VerifyDomainRequest,
  VerifyDomainResponse,
  VerifyDomainRequestSchema,
  VerifyDomainResponseSchema,
  CloudFlareHostnameStatus,
  CloudFlareSslStatus
} from "../types";
import { 
  determineVerificationStatus,
  getStatusUpdateData,
  VerificationStatusResult 
} from "../helpers";

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

export class VerifyDomainService {
  static async verify(
    userId: number,
    requestData: VerifyDomainRequest
  ): Promise<VerifyDomainResponse> {
    // Validate request data
    const validatedData = VerifyDomainRequestSchema.parse(requestData);
    const { hostname } = validatedData;

    console.log(`[Domain Verify] Starting domain verification for user ${userId}: ${hostname}`);

    try {
      // 1. Find domain record
      const domainRecord = await getPrisma().domain.findFirst({
        where: { 
          hostname,
          createdBy: userId 
        },
      });

      if (!domainRecord) {
        throw new Error('Domain not found');
      }

      console.log(`[Domain Verify] Found domain record:`, domainRecord);

      // 2. Check if domain is already active
      if (domainRecord.status === 'ACTIVE') {
        const response: VerifyDomainResponse = {
          message: 'Domain is already active.',
          domain: {
            id: domainRecord.id,
            hostname: domainRecord.hostname,
            type: domainRecord.type,
            status: domainRecord.status,
            sslStatus: domainRecord.sslStatus,
            isVerified: true,
            isActive: true,
            verificationToken: domainRecord.verificationToken,
            customHostnameId: domainRecord.cloudflareHostnameId,
            overallStatus: domainRecord.status,
            createdAt: domainRecord.createdAt,
            updatedAt: domainRecord.updatedAt,
          },
          isFullyActive: true,
          nextStep: null,
        };

        return VerifyDomainResponseSchema.parse(response);
      }

      // 3. Validate CloudFlare configuration
      const customHostnameId = domainRecord.cloudflareHostnameId;
      if (!customHostnameId) {
        throw new Error('Domain is not configured correctly');
      }

      // 4. Get CloudFlare configuration
      const cloudflareHelper = getCloudFlareAPIHelper();
      const config = cloudflareHelper.getConfig();
      const zoneId = config.cfZoneId;

      console.log(`[Domain Verify] Using CloudFlare zone ID: ${zoneId}`);

      // 5. Fetch current status from CloudFlare
      console.log(`[Domain Verify] Fetching hostname details for: ${customHostnameId}`);
      const cfHostname = await getCustomHostnameDetails(customHostnameId, zoneId);
      console.log(`[Domain Verify] CloudFlare hostname details:`, cfHostname);

      const { status, ssl } = cfHostname;
      const hostnameStatus = status as CloudFlareHostnameStatus;
      const sslStatus = ssl?.status as CloudFlareSslStatus;

      // 6. Determine verification status and next steps
      const verificationResult: VerificationStatusResult = determineVerificationStatus(
        hostnameStatus,
        sslStatus,
        ssl?.validation_records
      );

      console.log(`[Domain Verify] Verification result:`, verificationResult);

      // 7. Prepare database update data
      const updateData = getStatusUpdateData(hostnameStatus, sslStatus, verificationResult);

      console.log(`[Domain Verify] Updating domain with data:`, updateData);

      // 8. Update domain record
      const updatedDomain = await getPrisma().domain.update({
        where: { id: domainRecord.id },
        data: updateData,
      });

      console.log(`[Domain Verify] Domain updated successfully:`, updatedDomain);

      // 9. Prepare response
      const response: VerifyDomainResponse = {
        message: verificationResult.message,
        domain: {
          id: updatedDomain.id,
          hostname: updatedDomain.hostname,
          type: updatedDomain.type,
          status: updatedDomain.status,
          sslStatus: updatedDomain.sslStatus,
          isVerified: verificationResult.shouldUpdateVerified || updatedDomain.status !== 'PENDING',
          isActive: verificationResult.shouldUpdateActive || updatedDomain.status === 'ACTIVE',
          verificationToken: updatedDomain.verificationToken,
          customHostnameId: updatedDomain.cloudflareHostnameId,
          overallStatus: hostnameStatus,
          createdAt: updatedDomain.createdAt,
          updatedAt: updatedDomain.updatedAt,
        },
        isFullyActive: verificationResult.isFullyActive,
        nextStep: verificationResult.nextStep,
      };

      console.log(`[Domain Verify] Verification completed successfully`);
      return VerifyDomainResponseSchema.parse(response);

    } catch (error: any) {
      const errMsg = error.response?.data?.errors?.[0]?.message || error.message;
      console.error(`[Domain Verify] Error: ${errMsg}`, { stack: error.stack });
      throw new Error(errMsg || 'Failed to verify domain');
    }
  }
}