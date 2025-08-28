import {
  PrismaClient,
  DomainType,
} from "../../../generated/prisma-client";
import { getCloudFlareAPIHelper } from "../../shared/helpers";
import {
  DeleteDomainRequest,
  DeleteDomainResponse,
  deleteDomainRequest,
  deleteDomainResponse,
} from "../types/delete.types";

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

export class DeleteDomainService {
  static async delete(
    userId: number,
    requestData: DeleteDomainRequest
  ): Promise<DeleteDomainResponse> {
    const validatedData = deleteDomainRequest.parse(requestData);
    const { id, hostname } = validatedData;

    try {
      // Find domain record with ownership verification
      const whereClause: any = {
        createdBy: userId,
      };

      if (id) {
        whereClause.id = id;
      } else if (hostname) {
        whereClause.hostname = hostname;
      }

      const domainRecord = await getPrisma().domain.findFirst({
        where: whereClause,
      });

      if (!domainRecord) {
        throw new Error("Domain not found or not owned");
      }

      console.log(`[Delete Domain] Starting deletion for ${domainRecord.hostname}`);

      let customHostnameDeleted = false;
      let dnsRecordsDeleted = false;

      // Delete from CloudFlare based on domain type
      if (domainRecord.type === DomainType.CUSTOM_DOMAIN) {
        // Delete custom hostname from CloudFlare
        if (domainRecord.cloudflareHostnameId) {
          try {
            customHostnameDeleted = await this.deleteCustomHostname(
              domainRecord.cloudflareHostnameId,
              domainRecord.cloudflareZoneId || ""
            );
          } catch (error: any) {
            console.warn(`[Delete Domain] Failed to delete custom hostname:`, error.message);
            // Continue with database deletion even if CloudFlare deletion fails
          }
        }
      } else if (domainRecord.type === DomainType.SUBDOMAIN) {
        // Delete A record from CloudFlare
        if (domainRecord.cloudflareRecordId) {
          try {
            dnsRecordsDeleted = await this.deleteARecord(
              domainRecord.cloudflareRecordId,
              domainRecord.cloudflareZoneId || ""
            );
          } catch (error: any) {
            console.warn(`[Delete Domain] Failed to delete A record:`, error.message);
            // Continue with database deletion even if CloudFlare deletion fails
          }
        }
      }

      // Delete from database
      await getPrisma().domain.delete({
        where: { id: domainRecord.id },
      });

      console.log(`[Delete Domain] Successfully deleted domain ${domainRecord.hostname} from database`);

      const response: DeleteDomainResponse = {
        message: "Domain deleted successfully",
        details: {
          hostname: domainRecord.hostname,
          customHostnameDeleted,
          dnsRecordsDeleted,
          cloudflareRecordId: domainRecord.cloudflareRecordId,
          cloudflareHostnameId: domainRecord.cloudflareHostnameId,
        },
      };

      return deleteDomainResponse.parse(response);
    } catch (error: any) {
      const errMsg = error.message || "Failed to delete domain";
      console.error(`[Delete Domain] Error: ${errMsg}`, { stack: error.stack });
      throw new Error(errMsg);
    }
  }

  private static async deleteCustomHostname(
    customHostnameId: string,
    zoneId: string
  ): Promise<boolean> {
    try {
      const cloudflareHelper = getCloudFlareAPIHelper();
      const cf = cloudflareHelper.getAxiosInstance();

      const url = `/zones/${zoneId}/custom_hostnames/${customHostnameId}`;
      console.log(`[Delete Domain] Deleting custom hostname ${customHostnameId} from CloudFlare`);

      const response = await cf.delete(url);

      if (response.data.success) {
        console.log(`[Delete Domain] Successfully deleted custom hostname ${customHostnameId}`);
        return true;
      } else {
        console.warn(`[Delete Domain] CloudFlare deletion warning:`, response.data.errors);
        return false;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`[Delete Domain] Custom hostname ${customHostnameId} not found in CloudFlare (already deleted)`);
        return true; // Consider it successful if already deleted
      }
      throw error;
    }
  }

  private static async deleteARecord(
    recordId: string,
    zoneId: string
  ): Promise<boolean> {
    try {
      const cloudflareHelper = getCloudFlareAPIHelper();
      const cf = cloudflareHelper.getAxiosInstance();

      const url = `/zones/${zoneId}/dns_records/${recordId}`;
      console.log(`[Delete Domain] Deleting A record ${recordId} from CloudFlare`);

      const response = await cf.delete(url);

      if (response.data.success) {
        console.log(`[Delete Domain] Successfully deleted A record ${recordId}`);
        return true;
      } else {
        console.warn(`[Delete Domain] CloudFlare deletion warning:`, response.data.errors);
        return false;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`[Delete Domain] A record ${recordId} not found in CloudFlare (already deleted)`);
        return true; // Consider it successful if already deleted
      }
      throw error;
    }
  }
}