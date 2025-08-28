import { PrismaClient } from "../../../generated/prisma-client";
import { getCloudFlareAPIHelper } from "../../shared/helpers";
import { getCustomHostnameDetails } from "../../create-custom-domain/helpers";
import { 
  GetDNSInstructionsRequest,
  GetDNSInstructionsResponse,
  GetDNSInstructionsRequestSchema,
  GetDNSInstructionsResponseSchema,
  DNSRecordInstruction,
  DNSRecords,
  DNSRecordStatus
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

export class GetDNSInstructionsService {
  static async getDNSInstructions(
    userId: number,
    requestData: GetDNSInstructionsRequest
  ): Promise<GetDNSInstructionsResponse> {
    // Validate request data
    const validatedData = GetDNSInstructionsRequestSchema.parse(requestData);
    const { id, hostname } = validatedData;

    console.log(`[Get DNS Instructions] Fetching DNS instructions for user ${userId}:`, validatedData);

    try {
      // Build query conditions
      const whereClause: any = {
        createdBy: userId,
      };

      if (id) {
        whereClause.id = id;
      } else if (hostname) {
        whereClause.hostname = hostname;
      }

      // Find domain record
      const domainRecord = await getPrisma().domain.findFirst({
        where: whereClause,
      });

      if (!domainRecord) {
        throw new Error('Domain not found');
      }

      console.log(`[Get DNS Instructions] Found domain record:`, domainRecord);

      // Get current CloudFlare status if available
      let currentSslValidationRecords = null;
      if (domainRecord.cloudflareHostnameId) {
        try {
          const cloudflareHelper = getCloudFlareAPIHelper();
          const config = cloudflareHelper.getConfig();
          const cfHostname = await getCustomHostnameDetails(
            domainRecord.cloudflareHostnameId, 
            config.cfZoneId
          );
          
          if (cfHostname.ssl?.validation_records) {
            currentSslValidationRecords = cfHostname.ssl.validation_records;
          }
        } catch (error) {
          console.warn("[Get DNS Instructions] Could not fetch CloudFlare status:", error);
          // Continue without current status - use stored data
        }
      }

      // Prepare DNS records
      const dnsRecords = this.prepareDNSRecords(
        domainRecord,
        currentSslValidationRecords
      );

      // Calculate progress
      const { totalRecords, completedRecords, progress } = this.calculateProgress(
        domainRecord,
        dnsRecords
      );

      // Prepare response
      const response: GetDNSInstructionsResponse = {
        domain: {
          id: domainRecord.id,
          hostname: domainRecord.hostname,
          type: domainRecord.type,
          status: domainRecord.status,
          sslStatus: domainRecord.sslStatus,
          isVerified: domainRecord.status !== 'PENDING',
          isActive: domainRecord.status === 'ACTIVE',
          createdAt: domainRecord.createdAt,
        },
        dnsRecords,
        instructions: "Add these DNS records at your domain registrar (GoDaddy, Namecheap, CloudFlare, etc.). DNS changes can take up to 48 hours to propagate.",
        totalRecords,
        completedRecords,
        progress,
      };

      console.log(`[Get DNS Instructions] DNS instructions prepared successfully`);
      return GetDNSInstructionsResponseSchema.parse(response);

    } catch (error: any) {
      const errMsg = error.response?.data?.errors?.[0]?.message || error.message;
      console.error(`[Get DNS Instructions] Error: ${errMsg}`, { stack: error.stack });
      throw new Error(errMsg || 'Failed to get DNS instructions');
    }
  }

  private static prepareDNSRecords(
    domainRecord: any,
    currentSslValidationRecords?: any[]
  ): DNSRecords {
    const dnsRecords: DNSRecords = {};

    // Ownership verification record (TXT)
    if (domainRecord.ownershipVerification) {
      const ownershipStatus = this.getRecordStatus(domainRecord.status, 'ownership');
      dnsRecords.ownership = {
        type: "TXT",
        name: domainRecord.ownershipVerification.name?.split('.')[0] || "_cf-custom-hostname",
        value: domainRecord.ownershipVerification.value,
        purpose: "Domain Ownership Verification",
        status: ownershipStatus,
        required: true,
      };
    }

    // Traffic routing record (CNAME)
    if (domainRecord.dnsInstructions) {
      const trafficStatus = this.getRecordStatus(domainRecord.status, 'traffic');
      const cloudflareHelper = getCloudFlareAPIHelper();
      const config = cloudflareHelper.getConfig();
      dnsRecords.traffic = {
        type: domainRecord.dnsInstructions.type || "CNAME",
        name: domainRecord.dnsInstructions.name,
        value: `fallback.${config.cfDomain}`,
        purpose: domainRecord.dnsInstructions.purpose || "Live Traffic",
        status: trafficStatus,
        required: true,
      };
    }

    // SSL validation records (TXT/CNAME)
    const sslRecords = currentSslValidationRecords || domainRecord.sslValidationRecords;
    if (sslRecords && Array.isArray(sslRecords)) {
      const sslStatus = this.getRecordStatus(domainRecord.sslStatus, 'ssl');
      dnsRecords.ssl = sslRecords.map((record: any) => ({
        type: record.txt_name ? "TXT" : "CNAME",
        name: record.txt_name || record.cname_name || "ssl-validation",
        value: record.txt_value || record.cname_target || "ssl-value",
        purpose: "SSL Certificate Validation",
        status: sslStatus,
        required: domainRecord.status === 'VERIFIED' && domainRecord.sslStatus !== 'ACTIVE',
      }));
    }

    return dnsRecords;
  }

  private static getRecordStatus(domainStatus: string, recordType: 'ownership' | 'traffic' | 'ssl'): DNSRecordStatus {
    switch (recordType) {
      case 'ownership':
        return domainStatus === 'PENDING' ? 'pending' : 
               domainStatus === 'VERIFIED' ? 'verified' :
               domainStatus === 'ACTIVE' ? 'active' : 'pending';
      
      case 'traffic':
        return domainStatus === 'ACTIVE' ? 'active' : 'pending';
      
      case 'ssl':
        return domainStatus === 'ACTIVE' ? 'active' : 
               domainStatus === 'VERIFIED' ? 'pending' : 'pending';
      
      default:
        return 'pending';
    }
  }

  private static calculateProgress(domainRecord: any, dnsRecords: DNSRecords) {
    let totalRecords = 0;
    let completedRecords = 0;

    // Count ownership record
    if (dnsRecords.ownership) {
      totalRecords++;
      if (dnsRecords.ownership.status === 'verified' || dnsRecords.ownership.status === 'active') {
        completedRecords++;
      }
    }

    // Count traffic record
    if (dnsRecords.traffic) {
      totalRecords++;
      if (dnsRecords.traffic.status === 'active') {
        completedRecords++;
      }
    }

    // Count SSL records (only if required)
    if (dnsRecords.ssl && dnsRecords.ssl.length > 0) {
      const requiredSslRecords = dnsRecords.ssl.filter(record => record.required);
      totalRecords += requiredSslRecords.length;
      completedRecords += requiredSslRecords.filter(record => record.status === 'active').length;
    }

    const percentage = totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0;

    // Determine next step
    let nextStep: string | undefined;
    if (domainRecord.status === 'PENDING') {
      nextStep = "Add the TXT record for domain ownership verification";
    } else if (domainRecord.status === 'VERIFIED' && domainRecord.sslStatus !== 'ACTIVE') {
      if (dnsRecords.ssl && dnsRecords.ssl.length > 0) {
        nextStep = "Add the SSL validation records to complete setup";
      } else {
        nextStep = "Waiting for SSL certificate provisioning";
      }
    } else if (domainRecord.status === 'ACTIVE') {
      nextStep = undefined; // Fully complete
    }

    return {
      totalRecords,
      completedRecords,
      progress: {
        percentage,
        nextStep,
      },
    };
  }
}