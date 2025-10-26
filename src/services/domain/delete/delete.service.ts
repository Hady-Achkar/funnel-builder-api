import { DomainType } from "../../../generated/prisma-client";
import { getPrisma } from "../../../lib/prisma";
import {
  deleteAzureFrontDoorCustomDomain,
} from "../../../utils/domain-utils/azure-frontdoor-custom-domain";
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
          azureCustomDomainName: true,
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

      let azureDeleted = false;

      // Delete from Azure Front Door if it's a custom domain
      if (domainRecord.type === DomainType.CUSTOM_DOMAIN && domainRecord.azureCustomDomainName) {
        try {
          await deleteAzureFrontDoorCustomDomain(domainRecord.azureCustomDomainName);
          azureDeleted = true;
          console.log(`[Domain Delete] Successfully deleted from Azure: ${domainRecord.hostname}`);
        } catch (error: any) {
          console.error(`[Domain Delete] Azure API Error: ${error.message}`, {
            hostname: domainRecord.hostname,
            azureName: domainRecord.azureCustomDomainName,
            stack: error.stack,
          });
          // Continue with database deletion even if Azure deletion fails
        }
      }

      // For subdomains (*.digitalsite.io), no Azure deletion needed - wildcard handles them
      // Just delete from database

      await getPrisma().domain.delete({
        where: { id: domainRecord.id },
      });

      const message = domainRecord.type === DomainType.SUBDOMAIN
        ? "Subdomain deleted successfully"
        : azureDeleted
        ? "Domain deleted successfully from both database and Azure Front Door"
        : "Domain removed from database. Azure deletion may have failed (check logs).";

      const response: DeleteDomainResponse = {
        message,
        details: {
          hostname: domainRecord.hostname,
          azureDeleted,
          type: domainRecord.type,
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
