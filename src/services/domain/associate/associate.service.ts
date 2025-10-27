import { getPrisma } from "../../../lib/prisma";
import { DomainStatus, DomainType } from "../../../generated/prisma-client";
import {
  getAzureFrontDoorCustomDomainDetails,
  associateCustomDomainWithRoute,
} from "../../../utils/domain-utils/azure-frontdoor-custom-domain";
import {
  getAzureFrontDoorConfig,
  getAzureCdnClient,
} from "../../../utils/domain-utils/azure-frontdoor-api";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";
import {
  NotFoundError,
  BadRequestError,
  BadGatewayError,
} from "../../../errors/http-errors";
import { ZodError } from "zod";
import {
  AssociateDomainRequest,
  AssociateDomainResponse,
  AssociateDomainRequestSchema,
  AssociateDomainResponseSchema,
} from "../../../types/domain/associate";

export class AssociateDomainService {
  static async associate(
    userId: number,
    requestData: unknown
  ): Promise<AssociateDomainResponse> {
    try {
      // Validate request data
      const validatedData = AssociateDomainRequestSchema.parse(requestData);
      const { id, routeName } = validatedData;

      // Get domain from database
      const domainRecord = await getPrisma().domain.findUnique({
        where: { id },
        select: {
          id: true,
          hostname: true,
          type: true,
          status: true,
          sslStatus: true,
          workspaceId: true,
          azureCustomDomainName: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!domainRecord) {
        throw new NotFoundError("Domain not found");
      }

      // Check if it's a subdomain (no Azure association needed)
      if (domainRecord.type === DomainType.SUBDOMAIN) {
        throw new BadRequestError(
          "Subdomains (*.digitalsite.io) are automatically routed. No manual association needed."
        );
      }

      // Check permissions
      if (!domainRecord.workspaceId) {
        throw new BadRequestError("Domain is not associated with a workspace");
      }

      await PermissionManager.requirePermission({
        userId,
        workspaceId: domainRecord.workspaceId,
        action: PermissionAction.MANAGE_DOMAIN,
      });

      // Verify domain is in correct state
      if (domainRecord.status !== DomainStatus.VERIFIED && domainRecord.status !== DomainStatus.ACTIVE) {
        throw new BadRequestError(
          `Domain must be verified before association. Current status: ${domainRecord.status}. Please verify the domain first using POST /api/domains/verify/:id`
        );
      }

      // Check if Azure custom domain name exists
      if (!domainRecord.azureCustomDomainName) {
        throw new BadRequestError(
          "Domain configuration is incomplete. Please contact support."
        );
      }

      const azureCustomDomainName = domainRecord.azureCustomDomainName;

      // Check current Azure status
      let azureDomainDetails;
      try {
        azureDomainDetails = await getAzureFrontDoorCustomDomainDetails(
          azureCustomDomainName
        );
      } catch (error: any) {
        console.error("[Associate Domain] Failed to get Azure domain details:", error);
        throw new BadGatewayError(
          "Unable to retrieve domain information at this time. Please try again in a few minutes."
        );
      }

      // Verify domain is approved in Azure
      if (azureDomainDetails.domainValidationState !== "Approved") {
        throw new BadRequestError(
          `Domain validation is not yet complete (status: ${azureDomainDetails.domainValidationState}). Please verify your domain first before associating it.`
        );
      }

      // Associate domain with route
      try {
        await associateCustomDomainWithRoute(azureCustomDomainName, routeName);
        console.log(`[Associate Domain] Successfully associated ${domainRecord.hostname} with route ${routeName}`);
      } catch (error: any) {
        console.error("[Associate Domain] Azure association error:", error);

        // Check if already associated
        if (error.message?.includes("already") || error.message?.includes("exist")) {
          console.log(`[Associate Domain] Domain ${domainRecord.hostname} is already associated with route`);
          // Continue - treat as success (idempotent)
        } else {
          throw new BadGatewayError(
            "We couldn't activate your domain at this time. Please try again in a few minutes or contact support if the issue persists."
          );
        }
      }

      // Update domain status to ACTIVE
      const updatedDomain = await getPrisma().domain.update({
        where: { id: domainRecord.id },
        data: {
          status: DomainStatus.ACTIVE,
          lastVerifiedAt: new Date(),
        },
      });

      // Get route details from Azure
      const config = getAzureFrontDoorConfig();
      const client = getAzureCdnClient();

      let routeId = "";
      try {
        const route = await client.routes.get(
          config.resourceGroup,
          config.profileName,
          config.endpointName,
          routeName
        );
        routeId = route.id || "";
      } catch (error) {
        console.error("[Associate Domain] Failed to get route details:", error);
        // Continue without route ID
      }

      const response: AssociateDomainResponse = {
        message: `Success! Your domain is now active and serving traffic.`,
        domain: {
          id: updatedDomain.id,
          hostname: updatedDomain.hostname,
          type: updatedDomain.type,
          status: updatedDomain.status,
          sslStatus: updatedDomain.sslStatus,
          isAssociated: true,
          azureCustomDomainName: updatedDomain.azureCustomDomainName,
          createdAt: updatedDomain.createdAt,
          updatedAt: updatedDomain.updatedAt,
        },
        azureDetails: {
          customDomainId: azureDomainDetails.id,
          customDomainName: azureCustomDomainName,
          routeId: routeId,
          routeName: routeName,
          associatedAt: new Date(),
        },
      };

      return AssociateDomainResponseSchema.parse(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        throw new BadRequestError(
          error.issues[0]?.message || "Invalid request data"
        );
      }
      throw error;
    }
  }
}
