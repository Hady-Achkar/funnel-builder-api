import { DomainType, $Enums } from "../../../generated/prisma-client";
import { getPrisma } from "../../../lib/prisma";
import { deleteCustomHostname, deleteARecord } from "../../../helpers/domain/delete";
import { validateWorkspaceAccess } from "../../../helpers/domain/shared";
import {
  DeleteDomainResponse,
  deleteDomainResponse,
} from "../../../types/domain/delete";
import { BadRequestError } from "../../../errors/http-errors";
import { ZodError } from "zod";

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

      await validateWorkspaceAccess(userId, domainRecord.workspaceId, [
        $Enums.WorkspacePermission.DELETE_DOMAINS,
      ]);

      let customHostnameDeleted = false;
      let dnsRecordsDeleted = false;

      let cloudflareSuccess = false;
      try {
        if (domainRecord.type === DomainType.CUSTOM_DOMAIN) {
          if (domainRecord.cloudflareHostnameId) {
            customHostnameDeleted = await deleteCustomHostname(
              domainRecord.cloudflareHostnameId,
              domainRecord.cloudflareZoneId || ""
            );
            cloudflareSuccess = customHostnameDeleted;
          }
        } else if (domainRecord.type === DomainType.SUBDOMAIN) {
          if (domainRecord.cloudflareRecordId) {
            dnsRecordsDeleted = await deleteARecord(
              domainRecord.cloudflareRecordId,
              domainRecord.cloudflareZoneId || ""
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
