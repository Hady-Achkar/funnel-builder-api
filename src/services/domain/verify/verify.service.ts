import { getPrisma } from "../../../lib/prisma";
import {
  getAzureFrontDoorCustomDomainDetails,
  validateAzureFrontDoorCustomDomain,
  associateCustomDomainWithRoute,
} from "../../../utils/domain-utils/azure-frontdoor-custom-domain";
import {
  PermissionManager,
  PermissionAction,
} from "../../../utils/workspace-utils/workspace-permission-manager";
import { NotFoundError, BadRequestError, BadGatewayError } from "../../../errors/http-errors";
import { ZodError } from "zod";
import {
  VerifyDomainResponse,
  VerifyDomainRequestSchema,
  VerifyDomainResponseSchema,
} from "../../../types/domain/verify";

export class VerifyDomainService {
  static async verify(
    userId: number,
    requestData: unknown
  ): Promise<VerifyDomainResponse> {
    try {
      const validatedData = VerifyDomainRequestSchema.parse(requestData);
      const { id } = validatedData;

      const domainRecord = await getPrisma().domain.findUnique({
        where: { id },
      });

      if (!domainRecord) {
        throw new NotFoundError("Domain not found");
      }

      await PermissionManager.requirePermission({
        userId,
        workspaceId: domainRecord.workspaceId,
        action: PermissionAction.VERIFY_DOMAIN,
      });

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
            customHostnameId: domainRecord.azureCustomDomainName,
            overallStatus: domainRecord.status,
            createdAt: domainRecord.createdAt,
            updatedAt: domainRecord.updatedAt,
          },
          isFullyActive: true,
          nextStep: null,
        };

        return VerifyDomainResponseSchema.parse(response);
      }

      const azureCustomDomainName = domainRecord.azureCustomDomainName;
      if (!azureCustomDomainName) {
        throw new BadRequestError('Domain is not configured correctly');
      }

      return await this.verifyAzureFrontDoorDomain(domainRecord);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        throw new BadRequestError(
          error.issues[0]?.message || "Invalid request data"
        );
      }
      throw error;
    }
  }

  /**
   * Verify Azure Front Door custom domain
   */
  private static async verifyAzureFrontDoorDomain(domainRecord: any): Promise<VerifyDomainResponse> {
    try {
      const azureCustomDomainName = domainRecord.azureCustomDomainName;

      // Trigger validation
      await validateAzureFrontDoorCustomDomain(azureCustomDomainName);

      // Get updated status
      const azureDomain = await getAzureFrontDoorCustomDomainDetails(azureCustomDomainName);

      const { domainValidationState, tlsSettings } = azureDomain;

      let status = domainRecord.status;
      let sslStatus = domainRecord.sslStatus;
      let message = "Domain verification in progress.";
      let isFullyActive = false;
      let nextStep: string | null = "Please wait for Azure to validate your DNS records.";

      // Update status based on Azure validation state
      if (domainValidationState === "Approved") {
        status = "VERIFIED";
        message = "Domain ownership verified!";

        // Check SSL certificate status
        if (tlsSettings?.certificateType === "ManagedCertificate") {
          sslStatus = "ACTIVE";
          status = "ACTIVE";
          message = "Domain is fully active with SSL certificate!";
          isFullyActive = true;
          nextStep = null;

          // Associate domain with Front Door route if verified
          try {
            await associateCustomDomainWithRoute(azureCustomDomainName);
          } catch (error: any) {
            console.error("[Verify Domain] Failed to associate with route:", error);
            // Continue even if association fails - can be retried later
          }
        } else {
          nextStep = "Waiting for SSL certificate to be issued by Azure.";
        }
      } else if (domainValidationState === "Rejected") {
        status = "FAILED";
        message = "Domain validation failed. Please check your DNS records.";
        nextStep = "Verify that the TXT and CNAME records are correctly configured.";
      }

      const updatedDomain = await getPrisma().domain.update({
        where: { id: domainRecord.id },
        data: {
          status,
          sslStatus,
          azureDomainStatus: domainValidationState,
          azureCertStatus: tlsSettings?.certificateType || "Pending",
          lastVerifiedAt: new Date(),
        },
      });

      const response: VerifyDomainResponse = {
        message,
        domain: {
          id: updatedDomain.id,
          hostname: updatedDomain.hostname,
          type: updatedDomain.type,
          status: updatedDomain.status,
          sslStatus: updatedDomain.sslStatus,
          isVerified: domainValidationState === "Approved",
          isActive: status === "ACTIVE",
          verificationToken: updatedDomain.verificationToken,
          customHostnameId: updatedDomain.azureCustomDomainName,
          overallStatus: domainValidationState,
          createdAt: updatedDomain.createdAt,
          updatedAt: updatedDomain.updatedAt,
        },
        isFullyActive,
        nextStep,
      };

      return VerifyDomainResponseSchema.parse(response);
    } catch (error: any) {
      console.error("[Verify Azure Domain] Error:", error);
      throw new BadGatewayError(
        "Failed to verify domain with Azure Front Door. Please try again later."
      );
    }
  }
}
