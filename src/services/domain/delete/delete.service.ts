import { DomainType } from "../../../generated/prisma-client";
import { getPrisma } from "../../../lib/prisma";
import { deleteCustomHostname, deleteARecord } from "./utils/cloudflare-cleanup";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";
import {
  DeleteDomainResponse,
  deleteDomainResponse,
} from "../../../types/domain/delete";
import { BadRequestError } from "../../../errors/http-errors";
import { ZodError } from "zod";
import { getCloudFlareAPIHelper } from "../../../utils/domain-utils/cloudflare-api";

export class DeleteDomainService {
  static async delete(
    userId: number,
    requestData: unknown
  ): Promise<DeleteDomainResponse> {
    try {
      const params = requestData as any;
      const domainId = parseInt(params.id);

      if (isNaN(domainId) || domainId <= 0) {
        throw new BadRequestError("Invalid domain ID provided");
      }

      const domainRecord = await getPrisma().domain.findUnique({
        where: { id: domainId },
        select: {
          id: true,
          hostname: true,
          type: true,
          workspaceId: true,
          cloudflareRecordId: true,
          cloudflareHostnameId: true,
          cloudflareZoneId: true,
        },
      });

      if (!domainRecord) {
        throw new BadRequestError(
          "Domain not found or you don't have access to it"
        );
      }

      await PermissionManager.requirePermission({
        userId,
        workspaceId: domainRecord.workspaceId,
        action: PermissionAction.DELETE_DOMAIN,
      });

      let customHostnameDeleted = false;
      let dnsRecordsDeleted = false;

      let cloudflareSuccess = false;
      try {
        const cloudflareHelper = getCloudFlareAPIHelper();
        const config = cloudflareHelper.getConfig();

        if (domainRecord.type === DomainType.CUSTOM_DOMAIN) {
          if (domainRecord.cloudflareHostnameId) {
            // Use custom hostname zone (digitalsite.app) for custom domains
            const zoneId = config.cfCustomHostnameZoneId || domainRecord.cloudflareZoneId || config.cfZoneId;
            console.log('[Domain Delete] Deleting custom hostname:', domainRecord.cloudflareHostnameId, 'from zone:', zoneId);

            customHostnameDeleted = await deleteCustomHostname(
              domainRecord.cloudflareHostnameId,
              zoneId
            );
            cloudflareSuccess = customHostnameDeleted;
          }
        } else if (domainRecord.type === DomainType.SUBDOMAIN) {
          if (domainRecord.cloudflareRecordId) {
            // Use main zone (digitalsite.io) for subdomains
            const zoneId = domainRecord.cloudflareZoneId || config.cfZoneId;
            console.log('[Domain Delete] Deleting DNS record:', domainRecord.cloudflareRecordId, 'from zone:', zoneId);

            dnsRecordsDeleted = await deleteARecord(
              domainRecord.cloudflareRecordId,
              zoneId
            );
            cloudflareSuccess = dnsRecordsDeleted;
          }
        }
      } catch (error: any) {
        const errMsg =
          error.response?.data?.errors?.[0]?.message || error.message;
        console.error(`[Domain Delete] CloudFlare API Error: ${errMsg}`, {
          stack: error.stack,
        });
      }

      await getPrisma().domain.delete({
        where: { id: domainRecord.id },
      });

      const message = cloudflareSuccess
        ? "Domain deleted successfully"
        : "Domain removed from database. External service cleanup may have failed.";

      const response: DeleteDomainResponse = {
        message,
        details: {
          hostname: domainRecord.hostname,
          customHostnameDeleted,
          dnsRecordsDeleted,
          cloudflareRecordId: domainRecord.cloudflareRecordId,
          cloudflareHostnameId: domainRecord.cloudflareHostnameId,
        },
      };

      return deleteDomainResponse.parse(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const message = error.issues[0]?.message || "Invalid request data";
        throw new BadRequestError(message);
      }
      throw error;
    }
  }
}
